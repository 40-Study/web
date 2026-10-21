/**
 * QA ce-main-261021 F7/#1: giảng viên không có UI nào đọc `GET /exercises/:id/submissions`. Bảng này liệt kê
 * bài nộp của mọi học viên (tên, kết quả, điểm, test đạt, thời gian, lúc nộp); bấm một dòng xem mã nguồn,
 * lỗi và bộ test kể cả test ẩn.
 */

import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { ExerciseSubmissionsPanel } from "./exercise-submissions-panel";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const SUBMISSION = {
  id: "sub-1",
  exercise_id: "ex-1",
  user_id: "11111111-2222-3333-4444-555555555555",
  language: "python",
  code: "print(int(input()) * 2)",
  verdict: "wrong_answer",
  test_cases_passed: 2,
  total_test_cases: 3,
  execution_time_ms: 42,
  memory_used_kb: 3100,
  error_message: "Sai ở test 3",
  created_at: "2026-10-21T08:30:00Z",
  student: { id: "11111111-2222-3333-4444-555555555555", full_name: "Nguyễn Văn A", email: "a@demo.com" },
};
const TESTS = [
  { id: "t1", exercise_id: "ex-1", input: "1", expected_output: "2", is_hidden: false, display_order: 0 },
  { id: "t2", exercise_id: "ex-1", input: "SECRET-IN", expected_output: "SECRET-OUT", is_hidden: true, display_order: 1 },
];

function mockList(page: unknown) {
  mockApi.get.mockImplementation(async (url: string) => envelope(url.endsWith("/testcases") ? TESTS : page));
}

function renderPanel() {
  return renderWithProviders(
    <ExerciseSubmissionsPanel exerciseId="ex-1" exerciseTitle="Nhân đôi" open onOpenChange={vi.fn()} />,
  );
}

beforeEach(() => resetMockApi());

describe("ExerciseSubmissionsPanel", () => {
  it("liệt kê bài nộp kèm học viên, kết quả, điểm, số test đạt, thời gian chạy", async () => {
    mockList({ data: [SUBMISSION], total: 1, page: 1, page_size: 20 });
    renderPanel();

    expect(await screen.findByText("Nguyễn Văn A")).toBeTruthy();
    expect(mockApi.get).toHaveBeenCalledWith("/exercises/ex-1/submissions", { params: { page: 1, page_size: 20 } });
    expect(screen.getByText("a@demo.com")).toBeTruthy();
    expect(screen.getByText("Sai kết quả")).toBeTruthy();
    expect(screen.getByText("66/100")).toBeTruthy();
    expect(screen.getByText("2/3")).toBeTruthy();
    expect(screen.getByText("42 ms")).toBeTruthy();
  });

  it("bấm một dòng: hiện mã nguồn, lỗi và cả test ẩn", async () => {
    mockList({ data: [SUBMISSION], total: 1, page: 1, page_size: 20 });
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: /xem bài nộp của nguyễn văn a/i }));

    expect(screen.getByLabelText("Mã nguồn bài nộp").textContent).toBe(SUBMISSION.code);
    expect(screen.getByText("Sai ở test 3")).toBeTruthy();
    expect(await screen.findByText("SECRET-OUT")).toBeTruthy();
    expect(screen.getByTestId("submission-test-1").textContent).toContain("Ẩn");

    fireEvent.click(screen.getByRole("button", { name: /danh sách bài nộp/i }));
    expect(screen.getByText("Nguyễn Văn A")).toBeTruthy();
  });

  it("chưa có bài nộp (backend trả data: null) -> thông báo trống, không vỡ", async () => {
    mockList({ data: null, total: 0, page: 1, page_size: 20 });
    renderPanel();
    expect(await screen.findByText("Chưa có học viên nào nộp bài.")).toBeTruthy();
  });

  it("backend chưa gắn student -> vẫn hiện được dòng bằng mã học viên", async () => {
    mockList({ data: [{ ...SUBMISSION, student: undefined, verdict: "accepted", test_cases_passed: 3 }], total: 1, page: 1, page_size: 20 });
    renderPanel();
    expect(await screen.findByText("Học viên 11111111")).toBeTruthy();
    expect(screen.getByText("Chấp nhận")).toBeTruthy();
    expect(screen.getByText("100/100")).toBeTruthy();
  });

  it("lỗi tải -> báo lỗi và thử lại được", async () => {
    mockApi.get.mockRejectedValueOnce(new Error("403"));
    renderPanel();
    expect(await screen.findByText("Không tải được danh sách bài nộp.")).toBeTruthy();

    mockList({ data: [SUBMISSION], total: 1, page: 1, page_size: 20 });
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Nguyễn Văn A")).toBeTruthy();
  });

  it("nhiều trang -> sang trang sau gọi page=2", async () => {
    mockList({ data: [SUBMISSION], total: 45, page: 1, page_size: 20 });
    renderPanel();
    await screen.findByText("Trang 1/3 · 45 bài nộp");
    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    expect(await screen.findByText("Trang 2/3 · 45 bài nộp")).toBeTruthy();
    expect(mockApi.get).toHaveBeenCalledWith("/exercises/ex-1/submissions", { params: { page: 2, page_size: 20 } });
  });
});
