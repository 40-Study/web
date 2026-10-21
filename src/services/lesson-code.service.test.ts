/**
 * lessonCodeService: lịch sử bài nộp đọc từ `GET /exercises/:id/my-submissions` (backend trả verdict
 * chữ thường, không có điểm) và lỗi 5xx của máy chấm thành câu tiếng Việt, không lộ chi tiết backend.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";

const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api-client", () => ({
  api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) },
}));

import { lessonCodeService } from "./lesson-code.service";

beforeEach(() => {
  get.mockReset();
  post.mockReset();
});

describe("lessonCodeService.history", () => {
  it("gọi my-submissions của bài tập và chuẩn hoá verdict + điểm như kết quả nộp bài", async () => {
    get.mockResolvedValue({
      data: {
        message: "ok",
        data: {
          data: [
            {
              id: "s2",
              exercise_id: "e1",
              user_id: "u1",
              language: "javascript",
              code: "console.log(1)",
              verdict: "wrong_answer",
              test_cases_passed: 2,
              total_test_cases: 3,
              execution_time_ms: 41,
              created_at: "2026-10-21T08:00:00Z",
            },
            {
              id: "s1",
              exercise_id: "e1",
              user_id: "u1",
              language: "python",
              code: "print(1)",
              verdict: "system_error",
              test_cases_passed: 0,
              total_test_cases: 0,
              created_at: "2026-10-20T08:00:00Z",
            },
          ],
          total: 2,
          page: 1,
          page_size: 20,
        },
      },
    });

    const { items, total } = await lessonCodeService.history("e1");

    expect(get).toHaveBeenCalledWith("/exercises/e1/my-submissions", {
      params: { page: 1, page_size: 20 },
    });
    expect(total).toBe(2);
    expect(items).toEqual([
      {
        id: "s2",
        language: "javascript",
        code: "console.log(1)",
        status: "WRONG_ANSWER",
        passed: 2,
        total: 3,
        score: 66,
        execution_time_ms: 41,
        created_at: "2026-10-21T08:00:00Z",
      },
      {
        id: "s1",
        language: "python",
        code: "print(1)",
        status: "SYSTEM_ERROR",
        passed: 0,
        total: 0,
        score: 0,
        execution_time_ms: undefined,
        created_at: "2026-10-20T08:00:00Z",
      },
    ]);
  });

  it("danh sách null (chưa nộp lần nào) -> mảng rỗng", async () => {
    get.mockResolvedValue({ data: { message: "ok", data: { data: null, total: 0 } } });
    await expect(lessonCodeService.history("e1")).resolves.toEqual({ items: [], total: 0 });
  });
});

describe("lessonCodeService.judge", () => {
  const input = { request_id: "r1", code: "x", language: "python", stdin: "" };

  it("503 của máy chấm -> câu tiếng Việt giữ mã nguồn, không phải lỗi chung", async () => {
    post.mockRejectedValue(new ApiError(503, "JUDGE_UNAVAILABLE", "Service unavailable"));
    await expect(lessonCodeService.judge("l1", "e1", input, true)).rejects.toThrow(
      /Máy chấm Judge0 đang không sẵn sàng/
    );
    expect(post.mock.calls[0][0]).toBe("/lessons/l1/exercises/e1/submit");
  });

  it("lỗi 4xx giữ nguyên để màn hình đọc đúng lý do", async () => {
    const error = new ApiError(403, "FORBIDDEN", "Forbidden");
    post.mockRejectedValue(error);
    await expect(lessonCodeService.judge("l1", "e1", input, false)).rejects.toBe(error);
    expect(post.mock.calls[0][0]).toBe("/lessons/l1/exercises/e1/run");
  });
});
