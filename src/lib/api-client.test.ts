import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "./api-client";
import { ApiError, NetworkError, RateLimitError } from "./errors";

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

// Phase 3 (contract mục C): admin duyệt hồ sơ giảng viên → token cũ 401 ROLE_CHANGED, refresh
// thành công kèm role_changed + active_role. Interceptor phải phát fortex:auth-role-changed để
// AuthBootstrap chuyển vai trò — và TUYỆT ĐỐI không phát khi refresh thường (sẽ đá người dùng
// sang trang chủ vai trò mỗi 15 phút token hết hạn).
describe("API refresh — role_changed (Phase 3)", () => {
  function roleChangedResponse(config: InternalAxiosRequestConfig) {
    return new AxiosError("role changed", "ERR_BAD_REQUEST", config, undefined, {
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config,
      data: { message: "Role changed", code: "ROLE_CHANGED", error: "Please refresh token" },
    });
  }

  it("refresh trả role_changed=true -> phát fortex:auth-role-changed kèm activeRole mới, retry request", async () => {
    vi.spyOn(axios, "post").mockResolvedValue({
      data: {
        message: "Refresh token successfully",
        data: { access_token: "a", refresh_token: "r", role_changed: true, active_role: "TEACHER" },
      },
    });
    const onRoleChanged = vi.fn();
    window.addEventListener("fortex:auth-role-changed", onRoleChanged);
    let attempts = 0;

    const res = await api.get("/teacher-profiles/me", {
      adapter: async (config) => {
        attempts += 1;
        if (attempts === 1) throw roleChangedResponse(config);
        return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config };
      },
    });

    window.removeEventListener("fortex:auth-role-changed", onRoleChanged);
    expect(res.data).toEqual({ ok: true });
    expect(onRoleChanged).toHaveBeenCalledTimes(1);
    const event = onRoleChanged.mock.calls[0][0] as CustomEvent<{ activeRole: string | null }>;
    expect(event.detail).toEqual({ activeRole: "TEACHER" });
  });

  it("refresh thường (không có role_changed) -> KHÔNG phát event", async () => {
    vi.spyOn(axios, "post").mockResolvedValue({
      data: { message: "Refresh token successfully", data: { access_token: "a", refresh_token: "r" } },
    });
    const onRoleChanged = vi.fn();
    window.addEventListener("fortex:auth-role-changed", onRoleChanged);
    let attempts = 0;

    await api.get("/protected", {
      adapter: async (config) => {
        attempts += 1;
        if (attempts === 1) throw unauthorized(config);
        return { data: {}, status: 200, statusText: "OK", headers: {}, config };
      },
    });

    window.removeEventListener("fortex:auth-role-changed", onRoleChanged);
    expect(attempts).toBe(2);
    expect(onRoleChanged).not.toHaveBeenCalled();
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
    // Khớp NGUYÊN VĂN body thật của backend (internal/middleware/auth_middleware.go, nhánh
    // ACCOUNT_LOCKED) — kể cả field `error` tiếng Anh mà extractErrorMessage ưu tiên đọc.
    data: { message: "Tài khoản đã bị khoá", code: "ACCOUNT_LOCKED", error: "Please login again" },
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
    ).rejects.toMatchObject({ status: 401, code: "ACCOUNT_LOCKED" });
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

  // Nhánh thứ 2 ném AuthError: `case 401` trong switch — chỉ chạy khi request đã `_retry`
  // (refresh THÀNH CÔNG nhưng request gửi lại vẫn 401). Test đột biến lúc merge main vào #28
  // cho thấy bỏ `data?.code` riêng ở nhánh này thì 2 test trên vẫn xanh — test này khoá lại.
  it("refresh thành công nhưng retry vẫn 401 ACCOUNT_LOCKED (case 401 trong switch) -> error.code=ACCOUNT_LOCKED", async () => {
    const refresh = vi.spyOn(axios, "post").mockResolvedValue({ data: {} });
    let requestAttempts = 0;

    await expect(
      api.get("/protected", {
        adapter: async (config) => {
          requestAttempts += 1;
          throw lockedResponse(config);
        },
      })
    ).rejects.toMatchObject({ status: 401, code: "ACCOUNT_LOCKED" });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(requestAttempts).toBe(2);
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

// C2 (QA khách 260928, P2): mọi 401 đều gọi POST /auth/refresh-token, kể cả sai mật khẩu. Refresh
// dùng chung bucket rate-limit 5/phút/IP với /auth/login nên mỗi lần gõ sai tốn 2 lượt → 429 ở lần
// thứ 4. Khoá lại: request xác thực và phiên `anonymous` KHÔNG kích hoạt refresh.
describe("API 401 — không gọi refresh khi vô ích (C2)", () => {
  afterEach(() => {
    useAuthStore.setState({ sessionStatus: "checking", isAuthenticated: false });
  });

  it("401 ở POST /auth/login (sai mật khẩu) -> KHÔNG gọi refresh, KHÔNG phát session-expired", async () => {
    const refresh = vi.spyOn(axios, "post").mockResolvedValue({ data: {} });
    const expired = vi.fn();
    window.addEventListener("fortex:auth-session-expired", expired);
    let attempts = 0;

    await expect(
      api.post(
        "/auth/login",
        { email: "a@b.c", password: "wrong" },
        {
          adapter: async (config) => {
            attempts += 1;
            throw errorResponse(config, 401, { error: "invalid email or password" });
          },
        }
      )
    ).rejects.toMatchObject({ status: 401 });

    window.removeEventListener("fortex:auth-session-expired", expired);
    expect(refresh).not.toHaveBeenCalled();
    expect(expired).not.toHaveBeenCalled();
    expect(attempts).toBe(1);
  });

  it("khách (sessionStatus=anonymous) gặp 401 -> KHÔNG gọi refresh", async () => {
    useAuthStore.setState({ sessionStatus: "anonymous", isAuthenticated: false });
    const refresh = vi.spyOn(axios, "post").mockResolvedValue({ data: {} });

    await expect(
      api.get("/lessons/abc/contents", {
        adapter: async (config) => {
          throw unauthorized(config);
        },
      })
    ).rejects.toMatchObject({ status: 401 });

    expect(refresh).not.toHaveBeenCalled();
  });

  it("GET /auth/me (khôi phục phiên, không phải bước gửi mật khẩu) VẪN được refresh", async () => {
    useAuthStore.setState({ sessionStatus: "checking", isAuthenticated: false });
    const refresh = vi.spyOn(axios, "post").mockResolvedValue({ data: {} });
    let attempts = 0;

    const res = await api.get("/auth/me", {
      adapter: async (config) => {
        attempts += 1;
        if (attempts === 1) throw unauthorized(config);
        return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config };
      },
    });

    expect(res.data).toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  // Review PR #33 (BLOCKER): /auth/logout nằm sau AuthMiddleware. Access token hết hạn mà không
  // refresh thì logout thất bại, refresh token 7 ngày vẫn sống → người sau vào lại phiên cũ.
  it.each(["/auth/logout", "/auth/logout-all"])(
    "401 ở POST %s (access token hết hạn) -> refresh rồi gửi lại logout",
    async (path) => {
      useAuthStore.setState({ sessionStatus: "authenticated", isAuthenticated: true });
      const refresh = vi.spyOn(axios, "post").mockResolvedValue({ data: {} });
      let attempts = 0;

      const res = await api.post(path, undefined, {
        adapter: async (config) => {
          attempts += 1;
          if (attempts === 1) throw unauthorized(config);
          return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config };
        },
      });

      expect(res.data).toEqual({ ok: true });
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(attempts).toBe(2);
    }
  );
});

// C5 (QA admin A-P3-1): 429 không kèm số giây chờ dù backend có trả `retry_after`.
describe("API 429 — đọc retry_after (C5)", () => {
  it("body retry_after=37 -> RateLimitError.retryAfter=37, message tiếng Việt kèm số giây", async () => {
    const rejection = api.post("/auth/login", {}, {
      adapter: async (config) =>
        Promise.reject(errorResponse(config, 429, { error: "Too many requests", retry_after: 37 })),
    });

    await expect(rejection).rejects.toBeInstanceOf(RateLimitError);
    await expect(rejection).rejects.toMatchObject({
      retryAfter: 37,
      message: "Bạn thao tác quá nhiều lần, vui lòng thử lại sau 37 giây",
    });
  });
});