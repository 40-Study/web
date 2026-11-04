/**
 * QA3-01 / QA3-14: tìm kiếm đơn phải gửi lên server (?q=) thay vì lọc 20 dòng đã tải; từ khoá được
 * trim, đổi từ khoá thì về trang 1.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminOrdersPage from "./page";

let mockSearch = "";
const mockReplace = vi.fn();
const mockUseAdminOrders = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  usePathname: () => "/admin/orders",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

vi.mock("@/hooks/queries/use-admin-orders", () => ({
  useAdminOrders: (params: unknown) => {
    mockUseAdminOrders(params);
    return {
      // Server trả đơn không chứa từ khoá trong email: client KHÔNG được lọc lại.
      data: {
        items: [
          {
            id: "o1",
            order_number: "FX-000226",
            user_id: "u1",
            user_email: "an@demo.com",
            total_amount: 100,
            currency: "VND",
            status: "completed",
            created_at: "2026-11-01T00:00:00Z",
            items: [],
          },
        ],
        total_count: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
}));

const box = () => screen.getByPlaceholderText(/Tìm/i) as HTMLInputElement;

describe("AdminOrdersPage — tìm kiếm phía server", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockUseAdminOrders.mockReset();
    mockSearch = "";
  });

  it("gửi ?q= lên useAdminOrders và hiển thị đúng kết quả server trả về (không lọc lại ở client)", () => {
    mockSearch = "q=Nguyen%20Van%20A&page=3";
    render(<AdminOrdersPage />);
    expect(mockUseAdminOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "Nguyen Van A", page: 3 }),
    );
    expect(screen.getByText("FX-000226")).toBeTruthy();
  });

  it("không gửi q khi URL chỉ có dấu cách", () => {
    mockSearch = "q=%20%20";
    render(<AdminOrdersPage />);
    expect(mockUseAdminOrders).toHaveBeenLastCalledWith(expect.objectContaining({ q: undefined }));
  });

  it("gõ từ khoá ghi ?q= đã trim lên URL và reset page về 1", async () => {
    mockSearch = "page=4";
    render(<AdminOrdersPage />);
    fireEvent.change(box(), { target: { value: "  an@demo.com  " } });
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    const url = mockReplace.mock.calls.at(-1)![0] as string;
    expect(url).toBe("/admin/orders?q=an%40demo.com");
    expect(url).not.toContain("page=");
  });

  it("hai dấu cách không tạo ?q=++", async () => {
    render(<AdminOrdersPage />);
    fireEvent.change(box(), { target: { value: "  " } });
    await new Promise((r) => setTimeout(r, 450));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("QA3-05: nút Chi tiết nằm trong ô được ghim vào mép phải để thấy được ở 390px", () => {
    render(<AdminOrdersPage />);
    const cell = screen.getByRole("link", { name: "Chi tiết" }).closest("td")!;
    expect(cell.className).toContain("sticky");
    expect(cell.className).toContain("right-0");
  });
});
