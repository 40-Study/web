import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it, vi } from "vitest";
import { api } from "./api-client";
import { ApiError, NetworkError } from "./errors";

function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError("unauthorized", "ERR_BAD_REQUEST", config, undefined, {
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    config,
    data: { message: "expired" },
  });
}

function errorResponse(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  return new AxiosError("request failed", "ERR_BAD_REQUEST", config, undefined, {
    status,
    statusText: String(status),
    headers: {},
    config,
    data,
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

// Review PR #25 (item 3, MAJOR): extractErrorMessage có thể lộ lỗi kỹ thuật
// backend (SQL/panic message) khi status không phải 4xx — chỉ 4xx (lỗi do
// chính request) mới được hiển thị chi tiết `error`/`message` backend trả về;
// 5xx và mất mạng PHẢI luôn là thông báo chung tiếng Việt.
describe("extractErrorMessage — chỉ lộ chi tiết backend khi 4xx", () => {
  it("400 (chưa case riêng, vẫn là 4xx) -> hiện đúng chi tiết backend trả về", async () => {
    await expect(
      api.get("/orders", {
        adapter: async (config) =>
          Promise.reject(errorResponse(config, 400, { error: "coupon_code đã hết hạn" })),
      })
    ).rejects.toMatchObject({ message: "coupon_code đã hết hạn" });
  });

  it("404 (đã case riêng, vẫn 4xx) -> hiện đúng chi tiết backend trả về", async () => {
    await expect(
      api.get("/orders/does-not-exist", {
        adapter: async (config) =>
          Promise.reject(errorResponse(config, 404, { message: "order không tồn tại" })),
      })
    ).rejects.toMatchObject({ message: "order không tồn tại" });
  });

  it("500 -> KHÔNG lộ message/error kỹ thuật của backend, chỉ thông báo chung", async () => {
    const rejection = api.get("/orders", {
      adapter: async (config) =>
        Promise.reject(
          errorResponse(config, 500, {
            error: "pq: duplicate key value violates unique constraint \"orders_pkey\"",
          })
        ),
    });

    await expect(rejection).rejects.toBeInstanceOf(ApiError);
    await expect(rejection).rejects.toMatchObject({
      status: 500,
      message: "Có lỗi xảy ra, vui lòng thử lại",
    });
    await expect(rejection).rejects.not.toMatchObject({
      message: expect.stringContaining("duplicate key"),
    });
  });

  it("502/503 (5xx khác) -> cũng chỉ thông báo chung, không lộ backend", async () => {
    await expect(
      api.get("/orders", {
        adapter: async (config) =>
          Promise.reject(errorResponse(config, 503, { message: "upstream connect error" })),
      })
    ).rejects.toMatchObject({ status: 503, message: "Có lỗi xảy ra, vui lòng thử lại" });
  });

  it("mất mạng (không có response) -> NetworkError với thông báo chung tiếng Việt", async () => {
    const rejection = api.get("/orders", {
      adapter: async () => Promise.reject(new AxiosError("Network Error", "ERR_NETWORK")),
    });

    await expect(rejection).rejects.toBeInstanceOf(NetworkError);
    await expect(rejection).rejects.toMatchObject({ message: "Có lỗi xảy ra, vui lòng thử lại" });
  });
});
