/**
 * L6 mục 3: trang chi tiết đơn admin hiện TỪNG khoản tiền về muộn (mã giao dịch, số tiền, đã hoàn/chờ hoàn)
 * và hộp xác nhận chỉ gửi các khoản admin chọn (`refs`), để một lần bấm không tắt cờ cho khoản chưa hoàn.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import AdminOrderDetailPage from "./page";

const mockLateRefundMutate = vi.fn();

const BASE = {
  id: "order-1",
  order_number: "ORD-TEST-1",
  status: "cancelled",
  total_amount: 499000,
  currency: "VND",
  payment_method: "bank_transfer",
  created_at: "2026-09-28T00:00:00Z",
  items: [{ id: "item-1", course_id: "course-1", course_name: "Khóa test", price: 499000, discount_amount: 0, final_price: 499000 }],
  refund_needed: true,
  late_refunds: {
    pending_count: 2,
    pending_amount: "749000",
    items: [
      { ref: "L6-A", transaction_id: "L6-A", amount: "499000", flagged_at: "2026-09-28T01:00:00Z", refunded: false },
      { ref: "L6-B", transaction_id: "L6-B", amount: "250000", flagged_at: "2026-09-28T02:00:00Z", refunded: false },
      { ref: "L6-OLD", transaction_id: "L6-OLD", amount: "100000", flagged_at: "2026-09-27T01:00:00Z", refunded: true, refunded_at: "2026-09-27T05:00:00Z" },
    ],
  },
};
let mockOrder: Record<string, unknown> = BASE;

vi.mock("next/navigation", () => ({ useParams: () => ({ id: "order-1" }) }));
vi.mock("@/hooks/queries/use-admin-orders", () => ({
  useAdminOrder: () => ({ data: mockOrder, isLoading: false, isError: false, error: null, refetch: vi.fn() }),
  useRefundOrder: () => ({ mutate: vi.fn(), isPending: false }),
  useMarkLateRefunded: () => ({ mutate: mockLateRefundMutate, isPending: false }),
}));

describe("AdminOrderDetailPage — từng khoản tiền về muộn", () => {
  beforeEach(() => {
    mockLateRefundMutate.mockReset();
    mockOrder = BASE;
    useAuthStore.setState({ sessionStatus: "authenticated", permissions: ["PAYMENTS_MANAGE"] } as Partial<
      ReturnType<typeof useAuthStore.getState>
    >);
  });

  it("liệt kê mã giao dịch, số tiền và trạng thái từng khoản", () => {
    render(<AdminOrderDetailPage />);
    const list = screen.getByTestId("late-refund-list");
    expect(within(list).getByText("2 khoản chờ hoàn.")).toBeTruthy();
    for (const id of ["L6-A", "L6-B", "L6-OLD"]) expect(within(list).getByText(id)).toBeTruthy();
    expect(within(list).getAllByText("Chờ hoàn")).toHaveLength(2);
    expect(within(list).getAllByText("Đã hoàn")).toHaveLength(1);
  });

  it("chỉ gửi các khoản đã chọn: bỏ chọn L6-B thì refs = [L6-A]", () => {
    render(<AdminOrderDetailPage />);
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu đã hoàn tiền" }));
    // Khoản đã hoàn từ trước không có ô chọn.
    expect(screen.queryByLabelText("Khoản L6-OLD")).toBeNull();
    const a = screen.getByLabelText("Khoản L6-A") as HTMLInputElement;
    const b = screen.getByLabelText("Khoản L6-B") as HTMLInputElement;
    expect(a.checked && b.checked).toBe(true); // mặc định chọn tất cả
    fireEvent.click(b);
    fireEvent.change(screen.getByLabelText(/Mã giao dịch hoàn/i), { target: { value: "FT-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đã hoàn tiền" }));

    expect(mockLateRefundMutate).toHaveBeenCalledTimes(1);
    expect(mockLateRefundMutate.mock.calls[0][0]).toEqual({
      id: "order-1",
      dto: { note: "", transaction_ref: "FT-1", refs: ["L6-A"] },
    });
  });

  // Review L6 MINOR: job nền làm khoản mới xuất hiện giữa lúc admin đang mở hộp thoại. Khoản đó admin chưa
  // thấy lúc quyết định, nên KHÔNG được tự chọn (nếu không "đã hoàn" bị ghi cho khoản chưa chuyển khoản hoàn).
  const withNewItem = {
    ...BASE,
    late_refunds: {
      ...BASE.late_refunds,
      pending_count: 3,
      pending_amount: "1000000",
      items: [
        ...BASE.late_refunds.items,
        { ref: "L6-C", transaction_id: "L6-C", amount: "251000", flagged_at: "2026-09-28T03:00:00Z", refunded: false },
      ],
    },
  };

  it("khoản mới về sau khi mở hộp thoại hiện riêng, mặc định KHÔNG chọn, không bị gửi đi", () => {
    const { rerender } = render(<AdminOrderDetailPage />);
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu đã hoàn tiền" }));
    expect(screen.queryByTestId("late-refund-new-items")).toBeNull();

    mockOrder = withNewItem; // refetch: một khoản mới về
    rerender(<AdminOrderDetailPage />);
    const fresh = screen.getByTestId("late-refund-new-items");
    const c = within(fresh).getByLabelText("Khoản L6-C") as HTMLInputElement;
    expect(c.checked).toBe(false);
    // Hai khoản admin đã thấy lúc mở vẫn được chọn sẵn và nằm ngoài nhóm "mới".
    expect((screen.getByLabelText("Khoản L6-A") as HTMLInputElement).checked).toBe(true);
    expect(within(fresh).queryByLabelText("Khoản L6-A")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đã hoàn tiền" }));
    expect(mockLateRefundMutate.mock.calls[0][0].dto.refs).toEqual(["L6-A", "L6-B"]);
  });

  it("khoản mới chỉ được gửi khi admin chủ động chọn", () => {
    const { rerender } = render(<AdminOrderDetailPage />);
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu đã hoàn tiền" }));
    mockOrder = withNewItem;
    rerender(<AdminOrderDetailPage />);
    fireEvent.click(screen.getByLabelText("Khoản L6-C"));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đã hoàn tiền" }));
    expect(mockLateRefundMutate.mock.calls[0][0].dto.refs).toEqual(["L6-A", "L6-B", "L6-C"]);
  });

  it("bỏ chọn hết thì không xác nhận được", () => {
    render(<AdminOrderDetailPage />);
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu đã hoàn tiền" }));
    fireEvent.click(screen.getByLabelText("Khoản L6-A"));
    fireEvent.click(screen.getByLabelText("Khoản L6-B"));
    const confirm = screen.getByRole("button", { name: "Xác nhận đã hoàn tiền" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.click(confirm);
    expect(mockLateRefundMutate).not.toHaveBeenCalled();
  });

  it("đơn hoàn tất nhận chuyển dư vẫn có nút đánh dấu và danh sách khoản", () => {
    mockOrder = { ...BASE, status: "completed" };
    render(<AdminOrderDetailPage />);
    expect(screen.getByTestId("late-refund-list")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Đánh dấu đã hoàn tiền" })).toBeTruthy();
  });

  it("đơn không có late_refunds (backend cũ): hộp xác nhận cũ, không gửi refs", () => {
    mockOrder = { ...BASE, late_refunds: undefined };
    render(<AdminOrderDetailPage />);
    expect(screen.queryByTestId("late-refund-list")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu đã hoàn tiền" }));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đã hoàn tiền" }));
    expect(mockLateRefundMutate.mock.calls[0][0]).toEqual({ id: "order-1", dto: { note: "", transaction_ref: "" } });
  });
});