/** Q8-T10 (C22): useDeleteAccount hiện lý do số dư/yêu cầu rút thay vì câu "kiểm tra lại mật khẩu" sai ngữ cảnh. */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";
import { createTestQueryClient } from "@/test/utils";

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (m: string) => toastError(m), success: vi.fn() } }));
const deleteAccount = vi.fn();
vi.mock("@/services/auth.service", async (orig) => ({
  ...(await orig<typeof import("@/services/auth.service")>()),
  authService: { deleteAccount: (...a: unknown[]) => deleteAccount(...a) },
}));

// eslint-disable-next-line import/first
import { useDeleteAccount } from "./use-auth";

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
);

describe("useDeleteAccount", () => {
  beforeEach(() => {
    toastError.mockReset();
    deleteAccount.mockReset();
  });

  it("409 ERR_ACCOUNT_HAS_BALANCE -> toast nói về số dư / yêu cầu rút", async () => {
    deleteAccount.mockRejectedValue(new ApiError(409, "ERR_ACCOUNT_HAS_BALANCE", "wallet has balance"));
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });
    result.current.mutate({ password: "x" });
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError.mock.calls[0][0]).toMatch(/số dư trong ví hoặc yêu cầu rút tiền/);
  });

  it("lỗi khác (429) -> câu cũ 'kiểm tra lại mật khẩu'", async () => {
    deleteAccount.mockRejectedValue(new ApiError(429, "ERR_RATE_LIMITED", "too many requests"));
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });
    result.current.mutate({ password: "x" });
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError.mock.calls[0][0]).toMatch(/kiểm tra lại mật khẩu/);
  });

  it("sai mật khẩu (ERR_INVALID_PASSWORD) -> không toast, lỗi hiện ở ô nhập", async () => {
    deleteAccount.mockRejectedValue(new ApiError(400, "ERR_INVALID_PASSWORD", "invalid password"));
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });
    result.current.mutate({ password: "x" });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toastError).not.toHaveBeenCalled();
  });

  it("400 khác (lỗi DB) và 401 -> vẫn toast, không bị nuốt như sai mật khẩu", async () => {
    for (const err of [new ApiError(400, "ERR_VALIDATION", "failed to deactivate account: db down"), new ApiError(401, "ACCOUNT_LOCKED", "locked")]) {
      toastError.mockReset();
      deleteAccount.mockRejectedValue(err);
      const { result } = renderHook(() => useDeleteAccount(), { wrapper });
      result.current.mutate({ password: "x" });
      await waitFor(() => expect(toastError).toHaveBeenCalled());
    }
  });
});
