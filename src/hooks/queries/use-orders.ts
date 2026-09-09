/**
 * React Query hooks for order operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orderService, type CreateOrderDTO, type PaymentIntentDTO } from "@/services/order.service";
import { ApiError } from "@/lib/errors";

/** HTTP 402 = khóa học trong đơn cần thanh toán trước khi enroll (backend trả message tiếng Việt). */
function orderErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) return error.message;
  return fallback;
}

export const orderKeys = {
  all: ["orders"] as const,
  mine: () => [...orderKeys.all, "mine"] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
  paymentStatus: (id: string) => [...orderKeys.all, "payment-status", id] as const,
};

/** Fetch all orders for the current user */
export function useMyOrders() {
  return useQuery({
    queryKey: orderKeys.mine(),
    queryFn: () => orderService.getMyOrders(),
  });
}

/** Fetch a specific order by ID */
export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => orderService.getOrder(id),
    enabled: !!id,
  });
}

const PAYMENT_STATUS_POLL_INTERVAL_MS = 5_000;
const PAYMENT_TERMINAL_STATUSES = new Set(["completed", "paid", "cancelled", "refunded", "expired"]);

/**
 * Poll GET /orders/:id/payment-status mỗi 5s cho tới khi có kết quả cuối
 * (completed/cancelled/refunded/expired) hoặc quá hạn `expiresAt`
 * (ISO string từ PaymentIntent.expired_at — mục 13 trong plans/reports/
 * web-core-developer-260909-1412-web-logic-fixes.md).
 */
export function usePaymentStatus(id: string, enabled = false, expiresAt?: string | null) {
  return useQuery({
    queryKey: orderKeys.paymentStatus(id),
    queryFn: () => orderService.getPaymentStatus(id),
    enabled: !!id && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && PAYMENT_TERMINAL_STATUSES.has(status)) return false;
      if (expiresAt && Date.now() > new Date(expiresAt).getTime()) return false;
      return PAYMENT_STATUS_POLL_INTERVAL_MS;
    },
  });
}

/** Create a new order */
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateOrderDTO) => orderService.createOrder(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.mine() });
    },
    onError: (error) => {
      toast.error(orderErrorMessage(error, "Không thể tạo đơn hàng"));
    },
  });
}

/** Cancel an existing order */
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => orderService.cancelOrder(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: orderKeys.mine() });
      qc.invalidateQueries({ queryKey: orderKeys.detail(id) });
      toast.success("Đã hủy đơn hàng");
    },
    onError: () => {
      toast.error("Không thể hủy đơn hàng");
    },
  });
}

/** Tạo phiên thanh toán (bank_transfer/qr_transfer) cho một order — chỉ gọi được 1 lần khi order còn "pending". */
export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentIntentDTO }) =>
      orderService.createPaymentIntent(id, data),
    onError: (error) => {
      toast.error(orderErrorMessage(error, "Không thể tạo phiên thanh toán"));
    },
  });
}

/** Ép kiểm tra giao dịch ngân hàng ngay (nút "Tôi đã chuyển khoản") */
export function useCheckPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => orderService.checkPayment(id),
    onSuccess: (data, id) => {
      if (data.status === "completed" || data.status === "paid") {
        qc.invalidateQueries({ queryKey: orderKeys.detail(id) });
        qc.invalidateQueries({ queryKey: orderKeys.mine() });
      }
    },
    onError: (error) => {
      // "payment amount mismatch" khi user chuyển sai số tiền — hiện đúng
      // message thay vì im lặng như trước.
      toast.error(orderErrorMessage(error, "Chưa xác nhận được giao dịch, thử lại sau"));
    },
  });
}
