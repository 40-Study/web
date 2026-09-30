/**
 * businessRequest giữ `code` của 403/404/429 mà interceptor chung làm rơi — nền để báo lỗi bạn bè
 * đúng lý do (FRIEND_REQUEST_NOT_ALLOWED, FRIEND_DAILY_LIMIT_REACHED...).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, RateLimitError } from "@/lib/errors";

vi.mock("@/lib/api-client", () => ({ api: { request: vi.fn() } }));

import { api } from "@/lib/api-client";
import { BusinessApiError, businessRequest } from "./business-request";

/** Bắt lỗi ném ra; nếu KHÔNG ném thì tự làm test đỏ (không để `undefined` lọt qua các assertion). */
type Caught = Error & { status: number; code: string; retryAfter?: number; payload?: unknown };
const caught = (p: Promise<unknown>): Promise<Caught> =>
  p.then(
    () => {
      throw new Error("expected businessRequest to reject");
    },
    (e: unknown) => e as Caught
  );

const respond = (status: number, data: unknown, headers: Record<string, string> = {}) =>
  vi.mocked(api.request).mockResolvedValue({ status, data, headers } as never);

describe("businessRequest", () => {
  beforeEach(() => {
    vi.mocked(api.request).mockReset();
  });

  it("2xx: trả `data` đã bóc phong bì", async () => {
    respond(200, { message: "ok", data: { friends_count: 3 } });
    await expect(businessRequest({ method: "GET", url: "/friends/summary" })).resolves.toEqual({ friends_count: 3 });
  });

  it("2xx với data null (xoá) trả null", async () => {
    respond(200, { message: "ok", data: null });
    await expect(businessRequest({ method: "DELETE", url: "/friends/x" })).resolves.toBeNull();
  });

  it("yêu cầu axios nhận 400/403/404/409/429 là phản hồi, còn 401/500 vẫn để interceptor xử lý", async () => {
    respond(200, { data: null });
    await businessRequest({ method: "GET", url: "/x" });

    const { validateStatus } = vi.mocked(api.request).mock.calls[0][0] as { validateStatus: (s: number) => boolean };
    for (const ok of [200, 201, 400, 403, 404, 409, 429]) expect(validateStatus(ok)).toBe(true);
    for (const bad of [401, 500, 503]) expect(validateStatus(bad)).toBe(false);
  });

  it.each([
    [403, "FRIEND_REQUEST_NOT_ALLOWED"],
    [404, "FRIEND_USER_NOT_FOUND"],
    [409, "FRIEND_REQUEST_COOLDOWN"],
    [400, "FRIEND_SELF_REQUEST"],
  ])("%i giữ nguyên code %s (interceptor chung sẽ làm mất)", async (status, code) => {
    respond(status, { message: "Thông điệp", code });

    const err = await caught(businessRequest({ method: "POST", url: "/friends/requests" }));

    expect(err).toBeInstanceOf(BusinessApiError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(status);
    expect(err.code).toBe(code);
  });

  it("429 CÓ code (hạn mức nghiệp vụ) giữ code, không biến thành RateLimitError chung", async () => {
    respond(429, { message: "Quá hạn mức", code: "FRIEND_DAILY_LIMIT_REACHED" });

    const err = await caught(businessRequest({ method: "POST", url: "/friends/requests" }));

    expect(err).not.toBeInstanceOf(RateLimitError);
    expect(err.code).toBe("FRIEND_DAILY_LIMIT_REACHED");
  });

  it("429 KHÔNG có code (limiter chung) thành RateLimitError kèm số giây chờ", async () => {
    respond(429, { retry_after: 12 });

    const err = await caught(businessRequest({ method: "POST", url: "/friends/requests" }));

    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.retryAfter).toBe(12);
  });

  it("429 không code, chỉ có header Retry-After", async () => {
    respond(429, {}, { "retry-after": "7" });
    const err = await caught(businessRequest({ method: "GET", url: "/friends/search" }));
    expect(err.retryAfter).toBe(7);
  });

  it("lỗi mang theo `data` của body (vd. danh sách từ chối của 403) trong payload", async () => {
    respond(403, { message: "x", code: "GROUP_INVITE_NOT_ALLOWED", data: { rejected: [{ user_id: "u1" }] } });
    const err = await caught(businessRequest({ method: "POST", url: "/x" }));
    expect(err.payload).toEqual({ rejected: [{ user_id: "u1" }] });
  });
});
