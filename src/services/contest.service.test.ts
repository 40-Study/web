/**
 * Service giữ `code` nghiệp vụ của backend (interceptor dùng chung đổi 403/404 thành code cứng
 * "FORBIDDEN"/"NOT_FOUND" — nếu service rơi về đường đó, màn hình không nói được đúng lý do).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();
vi.mock("@/lib/api-client", () => ({ api: { request: (...args: unknown[]) => requestMock(...args) } }));

import { ContestApiError, contestService } from "./contest.service";

beforeEach(() => requestMock.mockReset());

describe("contestService — lỗi nghiệp vụ", () => {
  it.each([
    [403, "CONTEST_COURSE_REQUIRED"],
    [404, "CONTEST_RESULT_NOT_FOUND"],
    [409, "CONTEST_FULL"],
    [400, "INVALID_ID"],
  ])("HTTP %i {code:%s} -> ContestApiError giữ nguyên code", async (status, code) => {
    requestMock.mockResolvedValue({ status, data: { message: "english", code } });
    const error = await contestService.join("c1").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ContestApiError);
    expect((error as ContestApiError).code).toBe(code);
    expect((error as ContestApiError).status).toBe(status);
  });

  it("chỉ tự nhận 400/403/404/409; 401/429/5xx để interceptor xử lý (refresh token, rate limit)", async () => {
    requestMock.mockResolvedValue({ status: 200, data: { message: "ok", data: [] } });
    await contestService.list();
    const { validateStatus } = requestMock.mock.calls[0][0] as { validateStatus: (s: number) => boolean };
    expect([200, 201, 400, 403, 404, 409].every(validateStatus)).toBe(true);
    expect([401, 429, 500, 502].some(validateStatus)).toBe(false);
  });

  it("400 lỗi validate (không có code) -> VALIDATION_FAILED", async () => {
    requestMock.mockResolvedValue({ status: 400, data: { message: "Validation failed", errors: [{ field: "attempt_id" }] } });
    const error = await contestService.submit("c1", { attempt_id: "", answers: [] }).catch((e: unknown) => e);
    expect((error as ContestApiError).code).toBe("VALIDATION_FAILED");
  });

  it("thành công -> trả `data` trong envelope", async () => {
    requestMock.mockResolvedValue({ status: 200, data: { message: "Success", data: { items: [], total_count: 0 } } });
    await expect(contestService.list({ phase: "ACTIVE" })).resolves.toEqual({ items: [], total_count: 0 });
    expect(requestMock.mock.calls[0][0]).toMatchObject({ method: "GET", url: "/contests", params: { phase: "ACTIVE" } });
  });

  it("slug được encode khi ghép URL", async () => {
    requestMock.mockResolvedValue({ status: 200, data: { message: "Success", data: {} } });
    await contestService.getBySlug("a/b c");
    expect(requestMock.mock.calls[0][0]).toMatchObject({ url: "/contests/a%2Fb%20c" });
  });
});
