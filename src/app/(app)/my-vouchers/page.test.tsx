/**
 * L1 — "Voucher của tôi" đánh dấu voucher dành riêng (holders_only) để người giữ hiểu vì sao người
 * khác không dùng được mã này; voucher công khai không có nhãn.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

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

const baseEntry = (code: string, extra: Record<string, unknown>) => ({
  id: `s-${code}`, user_id: "u", voucher_id: `id-${code}`, saved_at: "2026-10-01T00:00:00Z", source: "manual",
  voucher: voucher(code, false), ...extra,
});

function serveVouchers(entries: unknown[]) {
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/vouchers/me") return { data: { vouchers: entries, total_count: entries.length, limit: 20, offset: 0 } };
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
}

beforeEach(() => {
  push.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
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

// Q7 (backend#143): `eligible` + `ineligible_reason` quyết định thẻ nào dùng được, không suy từ ngày/trạng thái.
describe("/my-vouchers — eligible / ineligible_reason", () => {
  it("voucher không dùng được: làm mờ, hiện lý do của backend, không có nút Dùng ngay / Sao chép", async () => {
    serveVouchers([
      baseEntry("HETLUOT", { eligible: false, ineligible_reason: "Bạn đã dùng hết lượt của mã này" }),
      baseEntry("OK", { eligible: true, ineligible_reason: "" }),
    ]);
    renderWithProviders(<MyVouchersPage />);
    await screen.findByText("HETLUOT");

    const ineligible = screen.getByTestId("voucher-ineligible");
    expect(ineligible.textContent).toContain("HETLUOT");
    expect(screen.getByTestId("voucher-ineligible-reason").textContent).toBe("Bạn đã dùng hết lượt của mã này");
    expect(ineligible.className).toContain("opacity-70");
    expect(ineligible.querySelector("button")).toBeNull();

    const eligible = screen.getByTestId("voucher-eligible");
    expect(eligible.textContent).toContain("OK");
    expect(screen.getAllByRole("button", { name: "Dùng ngay" })).toHaveLength(1);
  });

  it("voucher còn hạn nhưng eligible=false vẫn nằm ở nhóm 'Chưa dùng được' (không tin ngày/trạng thái)", async () => {
    serveVouchers([baseEntry("DONGIAN", { eligible: false, ineligible_reason: "Mã chỉ áp dụng cho đơn hàng đầu tiên" })]);
    renderWithProviders(<MyVouchersPage />);
    await screen.findByText("DONGIAN");
    expect(screen.queryByText(/Có thể sử dụng/)).toBeNull();
    expect(screen.getByText(/Chưa dùng được \(1\)/)).toBeTruthy();
  });

  it("backend cũ chưa trả eligible: suy từ trạng thái voucher như trước", async () => {
    serveVouchers([
      baseEntry("CON", {}),
      { ...baseEntry("TAT", {}), voucher: { ...voucher("TAT", false), is_active: false } },
    ]);
    renderWithProviders(<MyVouchersPage />);
    await screen.findByText("CON");
    expect(screen.getAllByTestId("voucher-eligible")).toHaveLength(1);
    expect(screen.getByTestId("voucher-ineligible-reason").textContent).toBe("Voucher hiện chưa dùng được");
  });

  it("Dùng ngay: sao chép mã rồi mở giỏ hàng (giỏ chưa nhận mã qua URL)", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    serveVouchers([baseEntry("DUNGNGAY", { eligible: true, ineligible_reason: "" })]);
    renderWithProviders(<MyVouchersPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Dùng ngay" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/cart"));
    expect(writeText).toHaveBeenCalledWith("DUNGNGAY");
    expect(toast.success).toHaveBeenCalledWith("Đã sao chép mã DUNGNGAY");
  });

  it("nút Sao chép chỉ sao chép, không chuyển trang; clipboard lỗi thì báo bằng tiếng Việt", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    serveVouchers([baseEntry("COPYME", { eligible: true, ineligible_reason: "" })]);
    renderWithProviders(<MyVouchersPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Sao chép mã COPYME" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
  });
});
