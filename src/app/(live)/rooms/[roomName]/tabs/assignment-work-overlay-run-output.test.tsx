import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * QA5 S5-01 / S5-12: "Chạy thử" in ra `output` của backend (không phải `stdout`), kết quả nộp bài cũ
 * không đứng cạnh kết quả chạy mới, và Esc đóng màn làm bài (role=dialog).
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

describe("AssignmentWorkOverlay — sửa bài sau khi đã nộp (review #127 mục 1)", () => {
  it("đã nộp, sửa code rồi Esc: không đóng, hiện xác nhận 'thay đổi chưa nộp lại'", async () => {
    mockBackend([WRONG]);
    const onClose = vi.fn();
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={onClose} />);
    await waitFor(() => expect((screen.getByTestId("editor") as HTMLTextAreaElement).value).toBe("print(1)"));
    fireEvent.change(screen.getByTestId("editor"), { target: { value: "print(99)" } });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Xác nhận thoát")).toBeTruthy();
    expect(screen.getByText(/thay đổi chưa nộp lại/)).toBeTruthy();
    // Thoát từ hộp này vẫn báo bài đã được tính.
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Thoát" }));
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("sửa rồi trả về đúng code đã nộp: Esc đóng thẳng, không hỏi", async () => {
    mockBackend([WRONG]);
    const onClose = vi.fn();
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={onClose} />);
    await waitFor(() => expect((screen.getByTestId("editor") as HTMLTextAreaElement).value).toBe("print(1)"));
    fireEvent.change(screen.getByTestId("editor"), { target: { value: "print(99)" } });
    fireEvent.change(screen.getByTestId("editor"), { target: { value: "print(1)" } });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("nộp xong rồi sửa tiếp: Esc hỏi; nộp lại xong thì Esc đóng thẳng", async () => {
    mockBackend([]);
    post.mockResolvedValue({ data: { id: "s9", verdict: "accepted", code: "x" } });
    const onSubmitted = vi.fn();
    const onClose = vi.fn();
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={onClose} onSubmitted={onSubmitted} />);
    await screen.findByTestId("editor");
    await waitFor(() => expect((screen.getByTestId("editor") as HTMLTextAreaElement).value).toBe("print(2+2)"));
    fireEvent.click(screen.getAllByRole("button", { name: "Nộp bài" })[0]);
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByTestId("editor"), { target: { value: "print(5)" } });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText(/thay đổi chưa nộp lại/)).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" }); // đóng hộp xác nhận
    fireEvent.click(screen.getAllByRole("button", { name: "Nộp bài" })[0]);
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(2));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledWith(true);
  });
});

describe("AssignmentWorkOverlay — hộp xác nhận đọc được bằng trình đọc màn hình (review #127 mục 2)", () => {
  it("khi hộp xác nhận mở: nó là alertdialog có tên, khung chính không còn aria-modal", async () => {
    mockBackend([]);
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={() => {}} />);
    const main = await screen.findByRole("dialog", { name: "T" });
    expect(main.getAttribute("aria-modal")).toBe("true");
    fireEvent.keyDown(document, { key: "Escape" });
    const confirm = screen.getByRole("alertdialog", { name: "Xác nhận thoát" });
    expect(confirm.getAttribute("aria-modal")).toBe("true");
    expect(main.getAttribute("aria-modal")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Tiếp tục làm" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(main.getAttribute("aria-modal")).toBe("true");
  });
});
