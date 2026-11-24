import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * QA5 S5-01 / S5-12: "Chạy thử" in ra `output` của backend (không phải `stdout`), kết quả nộp bài cũ
 * không đứng cạnh kết quả chạy mới, và Esc đóng màn làm bài (role=dialog).
 */
const get = vi.hoisted(() => vi.fn());
const post = vi.hoisted(() => vi.fn());

vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("@/components/meet/RichTextEditor", () => ({
  default: () => null,
  RichTextViewer: ({ content }: { content: string }) => <span>{content}</span>,
}));
vi.mock("@/lib/meet/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/meet/api")>("@/lib/meet/api");
  return { ...actual, api: { get, post } };
});

import AssignmentWorkOverlay from "./AssignmentWorkOverlay";

const SANDBOX = {
  assignment: { id: "a1", title: "T", description: "Đề", starter_code: "print(2+2)", language: ["python"] },
  sample_tests: [],
};
const WRONG = {
  id: "s1", assignment_id: "a1", language: "python", code: "print(1)",
  verdict: "wrong_answer", test_cases_passed: 0, total_test_cases: 3,
};

function mockBackend(mine: unknown[]) {
  get.mockImplementation(async (path: string) => {
    if (path.includes("/sandbox")) return SANDBOX;
    if (path.startsWith("/submissions/my/")) return { data: mine };
    throw new Error(`unexpected GET ${path}`);
  });
}

const runButton = async () => {
  const buttons = await screen.findAllByRole("button", { name: "Chạy thử" });
  return buttons[buttons.length - 1];
};

beforeEach(() => {
  get.mockReset();
  post.mockReset();
});

describe("AssignmentWorkOverlay — Chạy thử", () => {
  it("hiện `output` do backend trả, không phải '(no output)'", async () => {
    mockBackend([]);
    post.mockResolvedValue({ output: "4\n", verdict: "accepted" });
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={() => {}} />);
    fireEvent.click(await runButton());
    await waitFor(() => expect(document.body.textContent).toContain("4"));
    expect(screen.queryByText(/no output/)).toBeNull();
    expect(screen.queryByText("(không có kết quả in ra)")).toBeNull();
  });

  it("chương trình không in gì -> câu tiếng Việt", async () => {
    mockBackend([]);
    post.mockResolvedValue({ output: "", verdict: "accepted" });
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={() => {}} />);
    fireEvent.click(await runButton());
    expect(await screen.findByText("(không có kết quả in ra)")).toBeTruthy();
  });

  it("ẩn kết quả nộp cũ khi chạy thử lại", async () => {
    mockBackend([WRONG]);
    post.mockResolvedValue({ output: "4\n", verdict: "accepted" });
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={() => {}} />);
    await waitFor(() => expect(screen.getByTestId("live-submission-verdict")).toBeTruthy());
    fireEvent.click(await runButton());
    await waitFor(() => expect(screen.queryByTestId("live-submission-verdict")).toBeNull());
  });
});

describe("AssignmentWorkOverlay — hộp thoại", () => {
  it("có role=dialog và Esc đóng được (bài đã nộp)", async () => {
    mockBackend([WRONG]);
    const onClose = vi.fn();
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={onClose} />);
    expect(await screen.findByRole("dialog", { name: "T" })).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("live-submission-verdict")).toBeTruthy());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("Esc khi chưa nộp mở hộp xác nhận thoát, Esc lần nữa đóng hộp đó", async () => {
    mockBackend([]);
    const onClose = vi.fn();
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={onClose} />);
    await screen.findByRole("dialog", { name: "T" });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Xác nhận thoát")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Xác nhận thoát")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});
