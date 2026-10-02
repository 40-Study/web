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
    discount_percent: 10, max_discount_money: 30000, start_date: "2026-10-01T03:00:00Z", end_date: "2026-12-31T03:00:00Z",
    is_active: true, holders_only: false, used_count: 3, usage_limit: 10, usage_per_user: 1,
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

  // L6 mục 7: bật Dành riêng cho voucher đang công khai không thu hồi quyền người đã lưu — ghi rõ ở form.
  it("có ghi chú dưới công tắc: bật cho voucher đã công khai không thu hồi quyền người đã lưu", async () => {
    renderWithProviders(<AdminVouchersPage />);
    await screen.findAllByTestId("admin-voucher-row");
    const note = screen.getByTestId("holders-only-enable-note");
    expect(note.textContent).toContain("KHÔNG thu hồi");
    expect(note.textContent).toContain("đã lưu");
  });

  // L6 mục 8: sửa voucher, xoá ô ngày và trần giảm thì PUT gửi null (trước đây ô trống không gửi gì).
  it("sửa voucher: xoá ngày bắt đầu/kết thúc và trần giảm thì PUT gửi null", async () => {
    renderWithProviders(<AdminVouchersPage />);
    const rows = await screen.findAllByTestId("admin-voucher-row");
    fireEvent.click(rows[1].querySelector("button") as HTMLButtonElement);

    const form = screen.getByTestId("voucher-form");
    const [start, end] = Array.from(form.querySelectorAll("input[type=datetime-local]")) as HTMLInputElement[];
    expect(start.value).not.toBe(""); // form điền sẵn ngày hiện có
    expect(end.value).not.toBe("");
    fireEvent.change(start, { target: { value: "" } });
    fireEvent.change(end, { target: { value: "" } });
    fireEvent.change(screen.getByLabelText(/Giảm tối đa/), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => expect(mockApi.put).toHaveBeenCalledTimes(1));
    const [url, body] = mockApi.put.mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toBe("/vouchers/v-public");
    expect(body).toMatchObject({ start_date: null, end_date: null, max_discount_money: null });
  });

  it("sửa voucher mà giữ nguyên ngày và trần thì gửi lại giá trị, không gửi null", async () => {
    renderWithProviders(<AdminVouchersPage />);
    const rows = await screen.findAllByTestId("admin-voucher-row");
    fireEvent.click(rows[1].querySelector("button") as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => expect(mockApi.put).toHaveBeenCalledTimes(1));
    const body = mockApi.put.mock.calls[0][1] as Record<string, unknown>;
    expect(typeof body.start_date).toBe("string");
    expect(typeof body.end_date).toBe("string");
    expect(body.max_discount_money).toBe(30000);
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

  // L6 mục 8: phân trang thật thay cho giới hạn 100 voucher đầu.
  it("phân trang: hiện Trang 1/3, bấm Sau gọi backend với offset của trang kế", async () => {
    mockApi.get.mockImplementation(async (url: string, config?: { params?: { limit?: number; offset?: number } }) => {
      if (url !== "/vouchers") throw new Error(`GET không mong đợi trong test: ${url}`);
      const offset = config?.params?.offset ?? 0;
      return { data: { vouchers: [{ ...VOUCHERS[1], id: `p${offset}`, code: `PAGE${offset}` }], total_count: 45, limit: 20, offset } };
    });
    renderWithProviders(<AdminVouchersPage />);
    const nav = await screen.findByTestId("voucher-pagination");
    expect(nav.textContent).toContain("Trang 1/3");
    expect(nav.textContent).toContain("45 voucher");
    expect(mockApi.get).toHaveBeenCalledWith("/vouchers", { params: { limit: 20, offset: 0 } });
    expect((screen.getByRole("button", { name: "Trước" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Sau" }));
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledWith("/vouchers", { params: { limit: 20, offset: 20 } }));
    await waitFor(() => expect(screen.getByTestId("voucher-pagination").textContent).toContain("Trang 2/3"));
    expect((await screen.findAllByTestId("admin-voucher-row"))[0].textContent).toContain("PAGE20");
  });

  it("chỉ một trang thì không hiện thanh phân trang", async () => {
    renderWithProviders(<AdminVouchersPage />);
    await screen.findAllByTestId("admin-voucher-row");
    expect(screen.queryByTestId("voucher-pagination")).toBeNull();
  });
});
