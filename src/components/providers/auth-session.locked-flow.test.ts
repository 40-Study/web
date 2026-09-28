import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api-client";
import { isAccountLockedError } from "@/lib/errors";
import { queryClient } from "@/lib/query-client";
import { useAuthStore, type AuthUser } from "@/stores/auth.store";
import { bootstrapAuthSession } from "./auth-session";

// Luồng THẬT end-to-end (không mock authService/api-client): tài khoản bị admin khoá giữa phiên.
// Body lấy nguyên văn từ backend internal/middleware/auth_middleware.go (nhánh ACCOUNT_LOCKED) —
// có field `error: "Please login again"`. extractErrorMessage ưu tiên `error`, nên nếu UI lấy tiêu
// đề toast từ error.message thì người dùng thấy tiếng Anh. Test này khoá tiêu đề tiếng Việt.
const LOCKED_BODY = {
  message: "Tài khoản đã bị khoá",
  code: "ACCOUNT_LOCKED",
  error: "Please login again",
};

const authUser: AuthUser = { id: "user-1", email: "an@example.com", name: "An" };

function lockedAdapter(): AxiosAdapter {
  return async (config: InternalAxiosRequestConfig) => {
    throw new AxiosError("locked", "ERR_BAD_REQUEST", config, undefined, {
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config,
      data: LOCKED_BODY,
    });
  };
}

describe("tài khoản bị khoá giữa phiên — luồng thật api-client -> auth-session", () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.getState().clearServerSession();
    // Có `user` cache (đã từng đăng nhập) để bootstrap thật sự gọi GET /auth/me.
    useAuthStore.setState({ hasHydrated: true, user: authUser, activeRole: "STUDENT" });
    api.defaults.adapter = lockedAdapter();
    // RevokeAllSessions đã xoá refresh token -> refresh cũng thất bại.
    vi.spyOn(axios, "post").mockRejectedValue(new Error("refresh failed"));
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
  });

  it("toast tiêu đề tiếng Việt 'Tài khoản đã bị khoá', KHÔNG phải 'Please login again'", async () => {
    const toastError = vi.spyOn(toast, "error").mockImplementation(() => "" as never);

    await expect(bootstrapAuthSession()).resolves.toBe("anonymous");

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError.mock.calls[0][0]).toBe("Tài khoản đã bị khoá");
    expect(JSON.stringify(toastError.mock.calls)).not.toContain("Please login again");
    expect(useAuthStore.getState()).toMatchObject({ sessionStatus: "anonymous", user: null });
  });

  it("toast lỗi mutation toàn cục (query-client) không hiện 'Error / Please login again'", async () => {
    const error = await api.post("/orders", {}).catch((e: unknown) => e);
    expect(isAccountLockedError(error)).toBe(true);

    const toastError = vi.spyOn(toast, "error").mockImplementation(() => "" as never);
    const onError = queryClient.getDefaultOptions().mutations?.onError as
      | ((err: unknown) => void)
      | undefined;
    onError?.(error);

    expect(onError).toBeTypeOf("function");
    expect(toastError).not.toHaveBeenCalled();
  });
});
