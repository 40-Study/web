import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it, vi } from "vitest";
import { api } from "./api-client";

function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError("unauthorized", "ERR_BAD_REQUEST", config, undefined, {
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    config,
    data: { message: "expired" },
  });
}

describe("API cookie refresh boundary", () => {
  it("attempts refresh at most once for the original request", async () => {
    const refresh = vi.spyOn(axios, "post").mockResolvedValue({ data: {} });
    let requestAttempts = 0;

    await expect(
      api.get("/protected", {
        adapter: async (config) => {
          requestAttempts += 1;
          throw unauthorized(config);
        },
      })
    ).rejects.toMatchObject({ status: 401 });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(requestAttempts).toBe(2);
  });

  it("signals expiry without forcing a public-route navigation", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(new Error("refresh failed"));
    const expired = vi.fn();
    window.addEventListener("fortex:auth-session-expired", expired);
    const originalPath = window.location.pathname;

    await expect(
      api.get("/protected", {
        adapter: async (config) => {
          throw unauthorized(config);
        },
      })
    ).rejects.toMatchObject({ status: 401 });

    expect(expired).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe(originalPath);
    window.removeEventListener("fortex:auth-session-expired", expired);
  });
});

// Review đối kháng (plans/reports/review-260928-users-pr72-pr28.md, finding #5 MAJOR): trước
// đây mọi lỗi 401 bị gán CỨNG error.code="AUTH_ERROR", bỏ qua data.code thật mà backend trả
// (vd. "ACCOUNT_LOCKED") — buộc nơi tiêu thụ (use-auth.ts, auth-session.ts) phải so sánh
// NGUYÊN VĂN chuỗi message tiếng Việt, dễ vỡ nếu backend đổi câu chữ. 2 test dưới khoá lại
// hành vi ĐÚNG: error.code phải PHẢN ÁNH data.code thật từ response.
function lockedResponse(config: InternalAxiosRequestConfig) {
  return new AxiosError("locked", "ERR_BAD_REQUEST", config, undefined, {
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    config,
    data: { code: "ACCOUNT_LOCKED", message: "Tài khoản đã bị khoá" },
  });
}

describe("API 401 error.code — giữ nguyên code thật từ backend", () => {
  it("data.code=ACCOUNT_LOCKED (refresh cũng thất bại) -> error.code=ACCOUNT_LOCKED, KHÔNG hardcode AUTH_ERROR", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(new Error("refresh failed"));

    await expect(
      api.get("/protected", {
        adapter: async (config) => {
          throw lockedResponse(config);
        },
      })
    ).rejects.toMatchObject({ status: 401, code: "ACCOUNT_LOCKED", message: "Tài khoản đã bị khoá" });
  });

  it("401 không có data.code (vd. token hết hạn thường) -> fallback error.code=AUTH_ERROR", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(new Error("refresh failed"));

    await expect(
      api.get("/protected", {
        adapter: async (config) => {
          throw unauthorized(config); // data: { message: "expired" }, không có code
        },
      })
    ).rejects.toMatchObject({ status: 401, code: "AUTH_ERROR" });
  });
});
