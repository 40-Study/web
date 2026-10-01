/**
 * L1 — trang /admin/vouchers: checkbox "Voucher dành riêng" thật sự đi tới POST/PUT /vouchers.
 * Test ĐỎ nếu checkbox bị bỏ, hoặc holders_only không nằm trong body gửi lên.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import AdminVouchersPage from "./page";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const VOUCHERS = [
  {
    id: "v-hidden", code: "VIPONLY", name: "Thưởng cuộc thi", discount_unit: "MONEY", discount_method: "FIXED",
    discount_amount_money: 50000, is_active: true, holders_only: true, used_count: 0, usage_limit: 0, usage_per_user: 1,
  },
  {
    id: "v-public", code: "GIAM10", name: "Giảm 10%", discount_unit: "MONEY", discount_method: "PERCENT",
    discount_percent: 10, is_active: true, holders_only: false, used_count: 3, usage_limit: 10, usage_per_user: 1,
  },
];

beforeEach(() => {
  resetMockApi();
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/vouchers") return { data: { vouchers: VOUCHERS, total_count: 2, limit: 100, offset: 0 } };
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
  mockApi.post.mockResolvedValue({ data: { id: "new" } });
  mockApi.put.mockResolvedValue({ data: { id: "v-public" } });
});

describe("/admin/vouchers — voucher dành riêng (holders_only)", () => {
  it("liệt kê voucher và đánh dấu 'Dành riêng' đúng dòng", async () => {
    renderWithProviders(<AdminVouchersPage />);
    const rows = await screen.findAllByTestId("admin-voucher-row");
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain("VIPONLY");
    expect(rows[0].textContent).toContain("Dành riêng");
    expect(rows[1].textContent).not.toContain("Dành riêng");
  });

  it("tạo voucher mặc định công khai: body có holders_only=false", async () => {
    renderWithProviders(<AdminVouchersPage />);
    await screen.findAllByTestId("admin-voucher-row");
    const checkbox = screen.getByRole("checkbox", { name: /voucher dành riêng/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.change(screen.getByPlaceholderText("VD: GIAM50K"), { target: { value: "moi123" } });
    const form = screen.getByTestId("voucher-form");
    fireEvent.change(form.querySelectorAll("input")[1], { target: { value: "Voucher mới" } });
    fireEvent.change(screen.getByLabelText(/Số tiền giảm/), { target: { value: "20000" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo voucher" }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
    expect(mockApi.post).toHaveBeenCalledWith("/vouchers", expect.objectContaining({ code: "MOI123", holders_only: false }));
  });

  it("bật checkbox rồi tạo: body có holders_only=true", async () => {
    renderWithProviders(<AdminVouchersPage />);
    await screen.findAllByTestId("admin-voucher-row");
    fireEvent.change(screen.getByPlaceholderText("VD: GIAM50K"), { target: { value: "rieng1" } });
    const form = screen.getByTestId("voucher-form");
    fireEvent.change(form.querySelectorAll("input")[1], { target: { value: "Voucher riêng" } });
    fireEvent.change(screen.getByLabelText(/Số tiền giảm/), { target: { value: "20000" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /voucher dành riêng/i }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo voucher" }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
    expect(mockApi.post).toHaveBeenCalledWith("/vouchers", expect.objectContaining({ holders_only: true }));
  });

  it("sửa voucher dành riêng: checkbox điền sẵn, tắt đi thì PUT gửi holders_only=false", async () => {
    renderWithProviders(<AdminVouchersPage />);
    const rows = await screen.findAllByTestId("admin-voucher-row");
    fireEvent.click(rows[0].querySelector("button") as HTMLButtonElement);

    const checkbox = screen.getByRole("checkbox", { name: /voucher dành riêng/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => expect(mockApi.put).toHaveBeenCalledTimes(1));
    expect(mockApi.put).toHaveBeenCalledWith("/vouchers/v-hidden", expect.objectContaining({ holders_only: false }));
  });

  it("form sai thì báo lỗi tại form và KHÔNG gọi API", async () => {
    renderWithProviders(<AdminVouchersPage />);
    await screen.findAllByTestId("admin-voucher-row");
    fireEvent.click(screen.getByRole("button", { name: "Tạo voucher" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(mockApi.post).not.toHaveBeenCalled();
  });
});
