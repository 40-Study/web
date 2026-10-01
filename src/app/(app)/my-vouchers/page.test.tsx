/**
 * L1 — "Voucher của tôi" đánh dấu voucher dành riêng (holders_only) để người giữ hiểu vì sao người
 * khác không dùng được mã này; voucher công khai không có nhãn.
 */

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import MyVouchersPage from "./page";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const voucher = (code: string, holders_only: boolean) => ({
  id: `id-${code}`, code, name: code, discount_unit: "MONEY", discount_method: "FIXED",
  discount_amount_money: 50000, is_active: true, holders_only,
});

beforeEach(() => {
  resetMockApi();
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/vouchers/me") {
      return {
        data: {
          vouchers: [
            { id: "s1", user_id: "u", voucher_id: "id-RIENG", saved_at: "2026-10-01T00:00:00Z", source: "contest_reward", voucher: voucher("RIENG", true) },
            { id: "s2", user_id: "u", voucher_id: "id-CONG", saved_at: "2026-10-01T00:00:00Z", source: "manual", voucher: voucher("CONG", false) },
          ],
          total_count: 2, limit: 20, offset: 0,
        },
      };
    }
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
});

describe("/my-vouchers — voucher dành riêng", () => {
  it("chỉ voucher holders_only có nhãn 'Dành riêng cho bạn'", async () => {
    renderWithProviders(<MyVouchersPage />);
    await screen.findByText("RIENG");
    await screen.findByText("CONG");
    const badges = screen.getAllByTestId("holders-only-badge");
    expect(badges).toHaveLength(1);
    expect(badges[0].textContent).toBe("Dành riêng cho bạn");
  });
});
