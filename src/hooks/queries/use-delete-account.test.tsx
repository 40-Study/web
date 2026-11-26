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

  it("lỗi khác -> câu cũ 'kiểm tra lại mật khẩu'", async () => {
    deleteAccount.mockRejectedValue(new ApiError(401, "ERR_UNAUTHORIZED", "invalid password"));
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });
    result.current.mutate({ password: "x" });
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError.mock.calls[0][0]).toMatch(/kiểm tra lại mật khẩu/);
  });
});
