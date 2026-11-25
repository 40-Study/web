import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * QA6 S6-01 / C11: ngôn ngữ máy chấm không chạy được (Dart) có `auto_grade: false`. Web ẩn "Chạy thử", báo chấm thủ công,
 * vẫn cho nộp, dropdown ngôn ngữ không rỗng, và bài `pending` không bị coi là đang chờ máy chấm.
 */
const get = vi.hoisted(() => vi.fn());
const post = vi.hoisted(() => vi.fn());

vi.mock("next/dynamic", () => ({
  default: () =>
    function EditorStub(props: { value?: string; onChange?: (v: string) => void }) {
      return <textarea data-testid="editor" value={props.value ?? ""} onChange={(e) => props.onChange?.(e.target.value)} />;
    },
}));
vi.mock("@/components/meet/RichTextEditor", () => ({
  default: () => null,
  RichTextViewer: ({ content }: { content: string }) => <span>{content}</span>,
}));
vi.mock("@/lib/meet/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/meet/api")>("@/lib/meet/api");
  return { ...actual, api: { get, post } };
});

import AssignmentWorkOverlay, { MANUAL_GRADING_NOTICE } from "./AssignmentWorkOverlay";

function mockBackend(assignment: Record<string, unknown>) {
  get.mockImplementation(async (path: string) => {
    if (path.includes("/sandbox")) return { assignment: { id: "a1", title: "T", description: "Đề", starter_code: "", ...assignment }, sample_tests: [] };
    if (path.startsWith("/submissions/my/")) return { data: [] };
    throw new Error(`unexpected GET ${path}`);
  });
}

beforeEach(() => {
  get.mockReset();
  post.mockReset();
});

describe("AssignmentWorkOverlay — chấm thủ công (C11)", () => {
  it("auto_grade=false: ẩn Chạy thử, hiện thông báo, dropdown có Dart, vẫn nộp được và không chờ máy chấm", async () => {
    mockBackend({ language: ["dart"], auto_grade: false });
    post.mockResolvedValue({ data: { id: "s1", assignment_id: "a1", language: "dart", code: "x", verdict: "pending" } });
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={() => {}} />);

    expect(await screen.findByText(MANUAL_GRADING_NOTICE)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Chạy thử" })).toBeNull();
    expect(screen.getByRole("option", { name: "Dart" })).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Nộp bài" }).at(-1)!);
    await waitFor(() => expect(post).toHaveBeenCalledWith("/submissions", expect.objectContaining({ language: "dart" })));
    expect(await screen.findByText(/chờ giảng viên chấm thủ công/)).toBeTruthy();
    expect(screen.queryByText("Đang chấm bài...")).toBeNull();
    // Bài chấm thủ công không được hỏi lại verdict tự động (poll đầu tiên sau 1,5 s).
    await new Promise((r) => setTimeout(r, 1700));
    expect(get.mock.calls.some(([p]) => /^\/submissions\/s1$/.test(p))).toBe(false);
  });

  it("không có auto_grade (backend cũ): vẫn có Chạy thử", async () => {
    mockBackend({ language: ["python"] });
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={() => {}} />);
    expect((await screen.findAllByRole("button", { name: "Chạy thử" })).length).toBeGreaterThan(0);
    expect(screen.queryByText(MANUAL_GRADING_NOTICE)).toBeNull();
  });
});
