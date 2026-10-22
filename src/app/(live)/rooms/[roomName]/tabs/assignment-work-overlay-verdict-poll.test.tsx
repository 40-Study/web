import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Backend#138: POST /submissions trả 201 + dòng `pending`, chấm nền. Màn làm bài phải hỏi lại
 * GET /submissions/:id tới khi có verdict; `system_error` = máy chấm sập, bài không được tính.
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
  assignment: { id: "a1", title: "T", description: "Đề", starter_code: "print(1)", language: ["python"] },
  sample_tests: [],
};
const SYSTEM_ERROR_MESSAGE = "Máy chấm đang không sẵn sàng. Bài nộp chưa được tính, hãy nộp lại.";

function sub(verdict: string, extra: Record<string, unknown> = {}) {
  return { id: "s1", assignment_id: "a1", language: "python", code: "print(1)", verdict, test_cases_passed: 0, total_test_cases: 0, ...extra };
}

/** `mine` = GET /submissions/my/:id; `byId` = các lần GET /submissions/s1 lần lượt (lặp phần tử cuối). */
function mockBackend({ mine = [] as unknown[], byId = [] as unknown[] } = {}) {
  let i = 0;
  get.mockImplementation(async (path: string) => {
    if (path.includes("/sandbox")) return SANDBOX;
    if (path.startsWith("/submissions/my/")) return { data: mine };
    if (path === "/submissions/s1") {
      const next = byId[Math.min(i, byId.length - 1)];
      i += 1;
      return { data: next };
    }
    throw new Error(`unexpected GET ${path}`);
  });
}

const pollCalls = () => get.mock.calls.filter(([p]) => p === "/submissions/s1").length;
const verdictText = () => screen.queryByTestId("live-submission-verdict")?.textContent;

async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

async function renderAndSubmit() {
  const view = render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={() => {}} />);
  await flush();
  fireEvent.click(screen.getByRole("button", { name: "Nộp bài" }));
  await flush();
  return view;
}

beforeEach(() => {
  vi.useFakeTimers();
  get.mockReset();
  post.mockReset();
  post.mockResolvedValue({ message: "Submission created, processing...", data: sub("pending") });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AssignmentWorkOverlay — verdict bài nộp code (chấm nền)", () => {
  it("hỏi GET /submissions/:id tới khi hết pending rồi hiện verdict cuối", async () => {
    mockBackend({ byId: [sub("pending"), sub("wrong_answer", { test_cases_passed: 2, total_test_cases: 3 })] });
    await renderAndSubmit();

    expect(verdictText()).toBe("Đang chấm bài...");

    await flush(1_500);
    expect(pollCalls()).toBe(1);
    expect(verdictText()).toBe("Đang chấm bài...");

    await flush(1_500);
    expect(verdictText()).toBe("Kết quả: Sai kết quả · 2/3 test đạt");
    expect(screen.getByText("Đã nộp")).toBeTruthy();

    await flush(10_000);
    expect(pollCalls()).toBe(2);
  });

  it("system_error: báo máy chấm không sẵn sàng, không 'Đã nộp', nút Nộp bài vẫn bấm được", async () => {
    mockBackend({ byId: [sub("system_error")] });
    await renderAndSubmit();
    await flush(1_500);

    expect(verdictText()).toBe(SYSTEM_ERROR_MESSAGE);
    expect(screen.queryByText("Đã nộp")).toBeNull();
    expect((screen.getByRole("button", { name: "Nộp bài" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("mở lại màn: bài mới nhất system_error hiện cùng thông báo, không 'Đã nộp', không hỏi lại", async () => {
    mockBackend({ mine: [sub("system_error")] });
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={() => {}} />);
    await flush();

    expect(verdictText()).toBe(SYSTEM_ERROR_MESSAGE);
    expect(screen.queryByText("Đã nộp")).toBeNull();
    expect((screen.getByRole("button", { name: "Nộp bài" }) as HTMLButtonElement).disabled).toBe(false);
    await flush(5_000);
    expect(pollCalls()).toBe(0);
  });

  it("mở lại màn: bài mới nhất còn pending thì tiếp tục hỏi tới khi có verdict", async () => {
    mockBackend({ mine: [sub("pending")], byId: [sub("accepted", { test_cases_passed: 3, total_test_cases: 3 })] });
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={() => {}} />);
    await flush();
    expect(verdictText()).toBe("Đang chấm bài...");

    await flush(1_500);
    expect(verdictText()).toBe("Kết quả: Đạt toàn bộ test · 3/3 test đạt");
  });

  it("đóng màn (unmount) thì dừng hỏi", async () => {
    mockBackend({ byId: [sub("pending")] });
    const { unmount } = await renderAndSubmit();
    await flush(1_500);
    expect(pollCalls()).toBe(1);

    unmount();
    await flush(30_000);
    expect(pollCalls()).toBe(1);
  });

  it("nộp lại khi GET bài cũ đang bay: kết quả cũ về muộn bị bỏ qua, chuyển sang hỏi bài mới", async () => {
    let resolveStale: (value: unknown) => void = () => {};
    get.mockImplementation(async (path: string) => {
      if (path.includes("/sandbox")) return SANDBOX;
      if (path.startsWith("/submissions/my/")) return { data: [] };
      if (path === "/submissions/s1") return new Promise((resolve) => { resolveStale = resolve; });
      if (path === "/submissions/s2") return { data: sub("pending", { id: "s2" }) };
      throw new Error(`unexpected GET ${path}`);
    });
    await renderAndSubmit();
    await flush(1_500);
    expect(pollCalls()).toBe(1); // GET s1 đang bay

    post.mockResolvedValue({ message: "Submission created, processing...", data: sub("pending", { id: "s2" }) });
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài" }));
    await flush();

    await act(async () => {
      resolveStale({ data: sub("accepted", { test_cases_passed: 3, total_test_cases: 3 }) });
    });
    await flush();
    expect(verdictText()).toBe("Đang chấm bài...");

    await flush(1_500);
    expect(get.mock.calls.filter(([p]) => p === "/submissions/s2").length).toBe(1);
    expect(verdictText()).toBe("Đang chấm bài...");
  });

  it("system_error: bấm Thoát hiện hộp xác nhận, không báo đã nộp (onClose(true))", async () => {
    mockBackend({ mine: [sub("system_error")] });
    const onClose = vi.fn();
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={onClose} />);
    await flush();

    fireEvent.click(screen.getByRole("button", { name: "Thoát" }));

    expect(screen.getByText(/Bạn chưa nộp bài/)).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("StrictMode (effect chạy hai lần): mỗi nhịp chỉ một lần hỏi", async () => {
    mockBackend({ byId: [sub("pending")] });
    render(
      <StrictMode>
        <AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={() => {}} />
      </StrictMode>,
    );
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài" }));
    await flush();

    await flush(1_500);
    expect(pollCalls()).toBe(1);
    await flush(1_500);
    expect(pollCalls()).toBe(2);
  });

  it("quá ~2 phút vẫn pending: dừng hỏi, hiện trạng thái trung tính (không phải lỗi)", async () => {
    mockBackend({ byId: [sub("pending")] });
    await renderAndSubmit();

    await flush(120_000);
    expect(pollCalls()).toBe(80);
    expect(verdictText()).toBe("Đang chấm, kiểm tra lại sau.");
    expect(screen.queryByText(/Lỗi/)).toBeNull();

    await flush(30_000);
    expect(pollCalls()).toBe(80);
  });
});
