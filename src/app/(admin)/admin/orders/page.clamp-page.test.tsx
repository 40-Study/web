/**
 * QA7-A06: /admin/orders?page=9999 hiện "Không có đơn hàng nào" và không có thanh phân trang (trạng thái rỗng thay chỗ nó),
 * nên admin không còn đường quay lại. Server báo số trang thật (total_pages) thì kéo về trang cuối, như /admin/users.
 */
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminOrdersPage from "./page";

let mockSearch = "";
let mockData: Record<string, unknown>;
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  usePathname: () => "/admin/orders",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));
vi.mock("@/hooks/queries/use-admin-orders", () => ({
  useAdminOrders: () => ({ data: mockData, isLoading: false, isError: false, error: null, refetch: vi.fn() }),
}));

beforeEach(() => {
  mockReplace.mockReset();
  mockSearch = "";
});

describe("AdminOrdersPage — QA7-A06 trang vượt trang cuối", () => {
  it("?page=9999 với total_pages=31 và danh sách rỗng -> replace sang trang cuối, giữ bộ lọc khác", () => {
    mockSearch = "status=completed&page=9999";
    mockData = { items: [], total_count: 612, page: 9999, limit: 20, total_pages: 31 };
    render(<AdminOrdersPage />);

    expect(mockReplace).toHaveBeenCalledWith("/admin/orders?status=completed&page=31", { scroll: false });
  });

  it("không có kết quả nào (total_pages=0) thì không đẩy về trang 0", () => {
    mockSearch = "page=3";
    mockData = { items: [], total_count: 0, page: 3, limit: 20, total_pages: 0 };
    render(<AdminOrdersPage />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("trang hợp lệ thì URL giữ nguyên", () => {
    mockSearch = "page=2";
    mockData = { items: [], total_count: 40, page: 2, limit: 20, total_pages: 2 };
    render(<AdminOrdersPage />);

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
