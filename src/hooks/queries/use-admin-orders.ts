/**
 * React Query hooks — đơn hàng admin + hoàn tiền
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminOrderService,
  type AdminOrderListParams,
  type RefundOrderDTO,
} from "@/services/admin-order.service";
import { ApiError } from "@/lib/errors";
import { orderKeys } from "@/hooks/queries/use-orders";

export const adminOrderKeys = {
  all: ["admin-orders"] as const,
  list: (params?: AdminOrderListParams) => [...adminOrderKeys.all, "list", params ?? {}] as const,
  detail: (id: string) => [...adminOrderKeys.all, "detail", id] as const,
};

/** GET /orders/admin — danh sách toàn bộ đơn (admin). */
export function useAdminOrders(params?: AdminOrderListParams) {
  return useQuery({
    queryKey: adminOrderKeys.list(params),
    queryFn: () => adminOrderService.list(params),
  });
}

/** GET /orders/admin/:id — chi tiết đơn (admin). */
export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: adminOrderKeys.detail(id),
    queryFn: () => adminOrderService.get(id),
    enabled: !!id,
  });
}

/** Thông điệp thân thiện cho 3 mã lỗi refund đã biết (invalid_status/already_refunded); các lỗi
 * khác giữ nguyên message backend trả (đã Việt hoá — xem orderErrorMessage ở use-orders.ts). */
function refundErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return "Chỉ có thể hoàn tiền đơn đã thanh toán (completed).";
    if (error.status === 409) return "Đơn này đã được hoàn tiền trước đó.";
    if (error.message) return error.message;
  }
  return "Không thể hoàn tiền, thử lại sau.";
}

/** POST /orders/admin/:id/refund — xác nhận đã hoàn tiền (chuyển khoản tay). */
export function useRefundOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RefundOrderDTO }) =>
      adminOrderService.refund(id, dto),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: adminOrderKeys.all });
      // Đơn cũng có thể đang mở ở view của chính người mua (orderKeys) — làm mới luôn.
      qc.invalidateQueries({ queryKey: orderKeys.detail(id) });
      toast.success("Đã xác nhận hoàn tiền");
    },
    onError: (error) => {
      toast.error(refundErrorMessage(error));
    },
  });
}
