/** Q8-T04: lưu tài khoản nhận tiền thành công phải có toast xác nhận (trước đây hộp thoại chỉ đóng lại). */

import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { createAppQueryClient } from "@/lib/query-client";

const toastSuccess = vi.fn();
vi.mock("sonner", () => ({ toast: { success: (m: string) => toastSuccess(m), error: vi.fn() } }));
vi.mock("@/services/wallet.service", async (orig) => ({
  ...(await orig<typeof import("@/services/wallet.service")>()),
  walletService: { updateBankInfo: vi.fn().mockResolvedValue({}) },
}));

// eslint-disable-next-line import/first
import { useUpdateBankInfo } from "./use-wallet";

describe("useUpdateBankInfo", () => {
  it("thành công -> toast 'Đã lưu tài khoản nhận tiền'", async () => {
    const client = createAppQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useUpdateBankInfo(), { wrapper });
    await act(async () => {
      result.current.mutate({ bank_name: "VCB", bank_account_number: "0123456789", bank_account_name: "A" });
    });
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Đã lưu tài khoản nhận tiền"));
  });
});
