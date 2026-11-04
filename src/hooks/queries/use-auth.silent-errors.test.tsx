/**
 * G-08 (QA3 261104): OTP sai (và link-child 404) hiện lỗi inline VÀ một toast chung "Không thể thực hiện thao tác"
 * (toast mặc định của query-client). Các mutation mà form tự hiện lỗi phải tắt toast mặc định để chỉ còn một kênh.
 * Dùng query-client THẬT (có `onError` mặc định) để test đỏ khi ai đó bỏ `onError` riêng của hook.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { queryClient } from "@/lib/query-client";
import { ApiError } from "@/lib/errors";
import { authService } from "@/services/auth.service";
import { parentLinkService } from "@/services/parent-link.service";
import { useRegister, useRegisterRequest } from "./use-auth";
import { useCreateLinkRequest } from "./use-parent-link";

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

afterEach(() => vi.restoreAllMocks());

describe("mutation tự hiện lỗi inline không toast chung thêm một lần", () => {
  it("useRegister (OTP sai)", async () => {
    vi.spyOn(authService, "register").mockRejectedValue(new ApiError(400, "X", "invalid OTP, 2 attempts remaining"));
    const toastError = vi.spyOn(toast, "error").mockImplementation(() => "" as never);
    const { result } = renderHook(() => useRegister(), { wrapper });
    await expect(result.current.mutateAsync({ email: "a@b.vn", otp: "000000" })).rejects.toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toastError).not.toHaveBeenCalled();
  });

  it("useRegisterRequest (đăng ký thất bại)", async () => {
    vi.spyOn(authService, "registerRequest").mockRejectedValue(new ApiError(409, "X", "email already registered"));
    const toastError = vi.spyOn(toast, "error").mockImplementation(() => "" as never);
    const { result } = renderHook(() => useRegisterRequest(), { wrapper });
    await expect(
      result.current.mutateAsync({ email: "a@b.vn", password: "x", confirm_password: "x", user_name: "u" }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("useCreateLinkRequest (404 không tìm thấy học sinh): lỗi vẫn tới onError của form", async () => {
    vi.spyOn(parentLinkService, "create").mockRejectedValue(new ApiError(404, "X", "student not found"));
    const toastError = vi.spyOn(toast, "error").mockImplementation(() => "" as never);
    const { result } = renderHook(() => useCreateLinkRequest(), { wrapper });
    const onError = vi.fn();
    result.current.mutate({ student_email: "ghost@example.com", relationship: "parent" }, { onError });
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(toastError).not.toHaveBeenCalled();
  });
});
