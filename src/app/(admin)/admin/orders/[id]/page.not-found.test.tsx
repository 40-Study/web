/**
 * QA6-A06: mở /admin/orders/<id không có thật> hiện "Không thể tải dữ liệu" + "Thử lại" vô nghĩa. Backend (C8)
 * trả 404 cho id lạ và 400 cho id sai định dạng: cả hai là "không tìm thấy" kèm đường về danh sách.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, NotFoundError } from "@/lib/errors";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "0000" }), useRouter: () => ({ push }) }));

const mockOrderQuery = vi.fn();
vi.mock("@/hooks/queries/use-admin-orders", () => ({
  useAdminOrder: () => mockOrderQuery(),
  useRefundOrder: () => ({ mutate: vi.fn(), isPending: false }),
  useLateRefundOrder: () => ({ mutate: vi.fn(), isPending: false }),
}));

import AdminOrderDetailPage from "./page";

const failed = (error: unknown) => ({ data: undefined, isLoading: false, isError: true, error, refetch: vi.fn() });

beforeEach(() => push.mockReset());

describe("/admin/orders/[id] — không tìm thấy", () => {
  it.each([
    ["404 ERR_NOT_FOUND", new NotFoundError("Đơn hàng không tồn tại")],
    ["400 ERR_INVALID_ID", new ApiError(400, "ERR_INVALID_ID", "Mã đơn hàng không hợp lệ")],
  ])("%s -> 'Không tìm thấy đơn hàng', không có nút Thử lại, nút về danh sách", (_name, error) => {
    mockOrderQuery.mockReturnValue(failed(error));
    render(<AdminOrderDetailPage />);

    expect(screen.getByText("Không tìm thấy đơn hàng")).toBeTruthy();
    expect(screen.queryByText("Không thể tải dữ liệu")).toBeNull();
    expect(screen.queryByRole("button", { name: /Thử lại/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Về danh sách đơn hàng" }));
    expect(push).toHaveBeenCalledWith("/admin/orders");
  });

  it("lỗi máy chủ 500 vẫn là khối lỗi chung có Thử lại (không bị nuốt thành 'không tìm thấy')", () => {
    mockOrderQuery.mockReturnValue(failed(new ApiError(500, "UNKNOWN", "boom")));
    render(<AdminOrderDetailPage />);

    expect(screen.queryByText("Không tìm thấy đơn hàng")).toBeNull();
    expect(screen.getByRole("button", { name: /Thử lại/ })).toBeTruthy();
  });
});
