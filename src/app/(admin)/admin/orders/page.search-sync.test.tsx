/**
 * Review #34 MINOR: ô tìm kiếm trước đây chỉ đọc ?q= lúc mount. Back/Forward đổi URL thì ô vẫn
 * giữ chữ cũ, lệch với kết quả đang lọc.
 */

import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminOrdersPage from "./page";

let mockSearch = "";
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  usePathname: () => "/admin/orders",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

vi.mock("@/hooks/queries/use-admin-orders", () => ({
  useAdminOrders: () => ({
    data: { items: [], total: 0, page: 1, limit: 20, total_pages: 1 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

function searchBox(): HTMLInputElement {
  return screen.getByPlaceholderText(/Tìm/i) as HTMLInputElement;
}

describe("AdminOrdersPage — ô tìm kiếm theo URL", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockSearch = "q=ORD-A";
  });

  it("Back/Forward đổi ?q= thì ô tìm kiếm đổi theo", async () => {
    const view = render(<AdminOrdersPage />);
    expect(searchBox().value).toBe("ORD-A");

    // Mô phỏng bấm Back: URL đổi sang ?q=ORD-B, component render lại với searchParams mới.
    mockSearch = "q=ORD-B";
    await act(async () => view.rerender(<AdminOrdersPage />));
    expect(searchBox().value).toBe("ORD-B");

    mockSearch = "";
    await act(async () => view.rerender(<AdminOrdersPage />));
    expect(searchBox().value).toBe("");
  });
});
