/**
 * LessonCodeWorkspace (QA re-test 2026-10-21, gaps #6/#7/P3-12):
 * - bản nháp nhớ cả NGÔN NGỮ đã chọn (tải lại trang không quay về ngôn ngữ đầu);
 * - lịch sử nộp bài (verdict, điểm, thời gian), bấm một bài nộp để mở lại mã;
 * - lỗi máy chấm không để bảng kết quả hiện verdict cũ cạnh thông báo lỗi.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContestCodeResult } from "@/types/contest";

const get = vi.fn();
const judge = vi.fn();
const history = vi.fn();

vi.mock("@/services/lesson-code.service", () => ({
  lessonCodeService: {
    get: (...a: unknown[]) => get(...a),
    judge: (...a: unknown[]) => judge(...a),
    history: (...a: unknown[]) => history(...a),
  },
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (select: (s: { user: { id: string } }) => unknown) =>
    select({ user: { id: "u1" } }),
}));
vi.mock("./non-video-lesson-content", () => ({
  NonVideoLessonContent: () => null,
  useMarkLessonCompleted: () => ({ mutate: vi.fn(), isPending: false, data: undefined }),
}));
vi.mock("@/components/code-workspace/monaco-source-editor", () => ({
  MonacoSourceEditor: (p: {
    label: string;
    value: string;
    language: string;
    onChange: (v: string) => void;
  }) => (
    <textarea
      aria-label={p.label}
      data-language={p.language}
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  ),
}));

import { LessonCodeWorkspace } from "./lesson-code-workspace";

const STORAGE_KEY = "fortex:lesson-code:u1:l1:e1";
const accepted: ContestCodeResult = {
  id: "old",
  problem_id: "e1",
  language: "python",
  status: "ACCEPTED",
  score: 100,
  max_score: 100,
  passed: 2,
  total: 2,
  execution_time_ms: 12,
  memory_used_kb: 1,
  created_at: "2026-10-20T08:00:00Z",
  tests: [{ number: 1, hidden: false, status: "ACCEPTED", output: "1", expected: "1" }],
};

function detail(last?: ContestCodeResult) {
  return {
    exercise: {
      id: "e1",
      title: "Tổng hai số",
      description: "Cộng a và b",
      language: ["python", "javascript"],
      starter_code: "# viết lời giải",
      time_limit: 2,
      memory_limit: 256,
      pass_percentage: 100,
      test_cases: [
        {
          id: "t1",
          exercise_id: "e1",
          input: "1 2",
          expected_output: "3",
          is_hidden: false,
          display_order: 1,
        },
      ],
    },
    last_submission: last,
  };
}

function renderWorkspace() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <LessonCodeWorkspace
        lessonId="l1"
        exerciseId="e1"
        courseId="c1"
        courseSlug="khoa"
        completed={false}
      />
    </QueryClientProvider>
  );
}

const editor = () => screen.getByLabelText("Mã nguồn bài tập") as HTMLTextAreaElement;
const languageSelect = () => screen.getByLabelText("Ngôn ngữ bài tập") as HTMLSelectElement;

beforeEach(() => {
  localStorage.clear();
  get.mockReset().mockResolvedValue(detail());
  judge.mockReset();
  history.mockReset().mockResolvedValue({ items: [], total: 0 });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("LessonCodeWorkspace — bản nháp", () => {
  it("tải lại trang giữ ngôn ngữ đã chọn và mã nháp của ngôn ngữ đó", async () => {
    const first = renderWorkspace();
    await screen.findByLabelText("Mã nguồn bài tập");
    fireEvent.change(languageSelect(), { target: { value: "javascript" } });
    fireEvent.change(editor(), { target: { value: "console.log(42)" } });
    first.unmount();

    renderWorkspace();
    await screen.findByLabelText("Mã nguồn bài tập");
    await waitFor(() => expect(languageSelect().value).toBe("javascript"));
    expect(editor().value).toBe("console.log(42)");
    expect(editor().dataset.language).toBe("javascript");
  });

  it("đổi ngôn ngữ mà chưa gõ gì, tải lại trang -> vẫn mở ngôn ngữ đó", async () => {
    const first = renderWorkspace();
    await screen.findByLabelText("Mã nguồn bài tập");
    fireEvent.change(languageSelect(), { target: { value: "javascript" } });
    first.unmount();

    renderWorkspace();
    await screen.findByLabelText("Mã nguồn bài tập");
    await waitFor(() => expect(languageSelect().value).toBe("javascript"));
  });

  it("đọc được bản nháp kiểu cũ (chỉ map ngôn ngữ -> mã) đã lưu trước bản sửa", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ javascript: "let old = 1", python: "print(0)" })
    );
    renderWorkspace();
    await screen.findByLabelText("Mã nguồn bài tập");
    await waitFor(() => expect(editor().value).toBe("print(0)"));
    fireEvent.change(languageSelect(), { target: { value: "javascript" } });
    expect(editor().value).toBe("let old = 1");
  });

  it("ngôn ngữ đã lưu không còn được bài tập cho phép -> quay về ngôn ngữ đầu tiên", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ language: "go", drafts: { go: "package main" } })
    );
    renderWorkspace();
    await screen.findByLabelText("Mã nguồn bài tập");
    expect(languageSelect().value).toBe("python");
    expect(editor().value).toBe("# viết lời giải");
  });
});

describe("LessonCodeWorkspace — lịch sử nộp bài", () => {
  const rows = [
    {
      id: "s2",
      language: "javascript",
      code: "console.log(3)",
      status: "WRONG_ANSWER",
      passed: 1,
      total: 2,
      score: 50,
      execution_time_ms: 33,
      created_at: "2026-10-21T08:00:00Z",
    },
    {
      id: "s1",
      language: "python",
      code: "print(3)",
      status: "ACCEPTED",
      passed: 2,
      total: 2,
      score: 100,
      execution_time_ms: 20,
      created_at: "2026-10-20T08:00:00Z",
    },
  ];

  it("liệt kê các bài nộp (kết quả, điểm, thời gian chạy) và mở lại mã của bài được chọn", async () => {
    history.mockResolvedValue({ items: rows, total: rows.length });
    renderWorkspace();
    const list = await screen.findByRole("region", { name: "Lịch sử nộp bài" });
    await within(list).findByText("Sai kết quả");
    expect(history).toHaveBeenCalledWith("e1");
    expect(within(list).getByText("50/100")).toBeTruthy();
    expect(within(list).getByText("33 ms")).toBeTruthy();
    expect(within(list).getByText("Chấp nhận")).toBeTruthy();

    fireEvent.click(within(list).getAllByRole("button", { name: /Mở lại mã/ })[0]);
    await waitFor(() => expect(languageSelect().value).toBe("javascript"));
    expect(editor().value).toBe("console.log(3)");
  });

  it("mở lại mã sẽ đè một bản nháp khác -> hỏi trước, huỷ thì giữ nguyên bản nháp", async () => {
    history.mockResolvedValue({ items: rows, total: rows.length });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderWorkspace();
    const list = await screen.findByRole("region", { name: "Lịch sử nộp bài" });
    fireEvent.change(editor(), { target: { value: "print('đang viết')" } });

    fireEvent.click((await within(list).findAllByRole("button", { name: /Mở lại mã/ }))[1]);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(editor().value).toBe("print('đang viết')");
  });

  it("mở lại bài nộp cùng ngôn ngữ đang chọn -> trình soạn thảo hiện mã đó", async () => {
    history.mockResolvedValue({ items: rows, total: rows.length });
    renderWorkspace();
    const list = await screen.findByRole("region", { name: "Lịch sử nộp bài" });
    expect(languageSelect().value).toBe("python");

    fireEvent.click((await within(list).findAllByRole("button", { name: /Mở lại mã/ }))[1]);
    expect(languageSelect().value).toBe("python");
    expect(editor().value).toBe("print(3)");
  });

  it("mở lại mã xoá lỗi chấm bài cũ khỏi bảng kết quả", async () => {
    history.mockResolvedValue({ items: rows, total: rows.length });
    judge.mockRejectedValue(new Error("Máy chấm Judge0 đang không sẵn sàng."));
    const { container } = renderWorkspace();
    const list = await screen.findByRole("region", { name: "Lịch sử nộp bài" });
    fireEvent.click(screen.getByRole("button", { name: /Chạy thử/ }));
    const panel = container.querySelector(".code-panel-body") as HTMLElement;
    await within(panel).findByText(/Máy chấm Judge0 đang không sẵn sàng/);

    fireEvent.click((await within(list).findAllByRole("button", { name: /Mở lại mã/ }))[1]);
    expect(within(panel).queryByText(/Máy chấm Judge0 đang không sẵn sàng/)).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("bài nộp chưa có kết quả (đang chấm) không hiện điểm 0/100 và không tô màu lỗi", async () => {
    history.mockResolvedValue({
      items: [
        {
          id: "p",
          language: "python",
          code: "x",
          status: "PENDING",
          passed: 0,
          total: 0,
          score: 0,
          created_at: "2026-10-21T08:00:00Z",
        },
      ],
      total: 1,
    });
    renderWorkspace();
    const list = await screen.findByRole("region", { name: "Lịch sử nộp bài" });
    const verdict = await within(list).findByText("Đang chấm");
    expect(verdict.className).not.toMatch(/red/);
    expect(within(list).queryByText("0/100")).toBeNull();
    expect(within(list).getByRole("columnheader", { name: "Thao tác" })).toBeTruthy();
  });

  it("có nhiều bài nộp hơn số dòng hiện -> báo đang hiện bao nhiêu trên tổng", async () => {
    history.mockResolvedValue({ items: rows, total: 25 });
    renderWorkspace();
    const list = await screen.findByRole("region", { name: "Lịch sử nộp bài" });
    expect(await within(list).findByText(/2\/25/)).toBeTruthy();
  });

  it("đủ hết bài nộp -> không có dòng báo", async () => {
    history.mockResolvedValue({ items: rows, total: rows.length });
    renderWorkspace();
    const list = await screen.findByRole("region", { name: "Lịch sử nộp bài" });
    await within(list).findByText("Sai kết quả");
    expect(within(list).queryByText(/2\/2\b/)).toBeNull();
  });

  it("nộp bài xong thì tải lại lịch sử", async () => {
    judge.mockResolvedValue({ ...accepted, id: "new" });
    renderWorkspace();
    await screen.findByLabelText("Mã nguồn bài tập");
    await waitFor(() => expect(history).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: /Nộp bài/ }));
    await waitFor(() => expect(history).toHaveBeenCalledTimes(2));
  });
});

describe("LessonCodeWorkspace — chấm bài", () => {
  it("lỗi máy chấm: bảng kết quả không còn hiện verdict cũ, mã được giữ", async () => {
    get.mockResolvedValue(detail(accepted));
    judge.mockRejectedValue(
      new Error(
        "Máy chấm Judge0 đang không sẵn sàng. Mã nguồn và kết quả trước vẫn được giữ; hãy thử nộp lại."
      )
    );
    const { container } = renderWorkspace();
    await screen.findByLabelText("Mã nguồn bài tập");
    fireEvent.change(editor(), { target: { value: "print(3)" } });
    fireEvent.click(screen.getByRole("tab", { name: /Kết quả/ }));
    const panel = container.querySelector(".code-panel-body") as HTMLElement;
    expect(within(panel).getByText("Chấp nhận")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Nộp bài/ }));
    await screen.findAllByText(/Máy chấm Judge0 đang không sẵn sàng/);
    expect(within(panel).queryByText("Chấp nhận")).toBeNull();
    expect(editor().value).toBe("print(3)");
  });

  it("bấm Nộp bài hai lần liên tiếp chỉ gửi một yêu cầu", async () => {
    let resolve: (v: ContestCodeResult) => void = () => {};
    judge.mockImplementation(() => new Promise((r) => (resolve = r)));
    renderWorkspace();
    await screen.findByLabelText("Mã nguồn bài tập");
    const submit = screen.getByRole("button", { name: /Nộp bài/ });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(judge).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ ...accepted, id: "n" }));
  });
});
