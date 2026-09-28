/**
 * React Query hooks for order operations
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orderService, type CreateOrderDTO, type PaymentIntentDTO } from "@/services/order.service";
import { ApiError } from "@/lib/errors";

/** HTTP 402 = khóa học trong đơn cần thanh toán trước khi enroll (backend trả message tiếng Việt). */
function orderErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) return error.message;
  return fallback;
}

/** 409 ERR_ORDER_IN_PROGRESS: đã có đơn còn hạn cho khóa này (backend B4). */
export const ORDER_IN_PROGRESS_CODE = "ERR_ORDER_IN_PROGRESS";

/**
 * 409 ERR_ORDER_EXPIRED: đơn đã quá hạn giữ, backend từ chối mở phiên thanh toán và chuyển đơn
 * sang "expired" (review backend #76 MAJOR 2). Hộp thanh toán hiện màn "hết hạn" + "Tạo đơn mới".
 */
export const ORDER_EXPIRED_CODE = "ERR_ORDER_EXPIRED";

export function isOrderExpiredError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 409 && error.code === ORDER_EXPIRED_CODE;
}

export interface MyOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const orderKeys = {
  all: ["orders"] as const,
  mine: () => [...orderKeys.all, "mine"] as const,
  mineList: (params: MyOrdersParams) => [...orderKeys.mine(), params] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
  paymentStatus: (id: string) => [...orderKeys.all, "payment-status", id] as const,
};

/** Đơn hàng của user hiện tại (phân trang, lọc trạng thái) — trang /orders. */
export function useMyOrders(params: MyOrdersParams = {}) {
  return useQuery({
    queryKey: orderKeys.mineList(params),
    queryFn: () => orderService.getMyOrders(params),
    placeholderData: keepPreviousData,
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
 * Re-review #76 vòng 2: hết hạn mã KHÔNG phải kết quả cuối. Backend đối chiếu ngân hàng lần cuối rồi
 * mới chốt completed/expired (và giữ nguyên trạng thái nếu chưa xác minh được), nên vẫn poll thêm
 * một khoảng sau hạn để nhận đúng kết quả đó thay vì tự coi là hết hạn.
 */
export const PAYMENT_FINAL_CHECK_WINDOW_MS = 10 * 60_000;

/**
 * Poll GET /orders/:id/payment-status mỗi 5s cho tới khi có kết quả cuối
 * (completed/cancelled/refunded/expired), hoặc quá `expiresAt` + PAYMENT_FINAL_CHECK_WINDOW_MS
 * (ISO string từ PaymentIntent.expired_at — mục 13 trong plans/reports/
 * web-core-developer-260909-1412-web-logic-fixes.md).
 */
/** Nhịp poll kế tiếp (ms) hoặc false để dừng: dừng khi có kết quả cuối hoặc quá hạn + cửa sổ đối chiếu. */
export function nextPaymentPollDelay(status: string | undefined, expiresAt?: string | null, now = Date.now()): number | false {
  if (status && PAYMENT_TERMINAL_STATUSES.has(status)) return false;
  if (expiresAt && now > new Date(expiresAt).getTime() + PAYMENT_FINAL_CHECK_WINDOW_MS) return false;
  return PAYMENT_STATUS_POLL_INTERVAL_MS;
}

export function usePaymentStatus(id: string, enabled = false, expiresAt?: string | null) {
  return useQuery({
    queryKey: orderKeys.paymentStatus(id),
    queryFn: () => orderService.getPaymentStatus(id),
    enabled: !!id && enabled,
    refetchInterval: (query) => nextPaymentPollDelay(query.state.data?.status, expiresAt),
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
      // Đơn trùng khóa đang chờ chuyển khoản: chỉ user tự quyết tiếp tục hay hủy đơn cũ, nên
      // dẫn thẳng sang "Đơn hàng của tôi" thay vì để user bấm lại "Mua ngay" vô ích.
      if (error instanceof ApiError && error.status === 409 && error.code === ORDER_IN_PROGRESS_CODE) {
        toast.error(error.message, {
          action: { label: "Xem đơn hàng", onClick: () => window.location.assign("/orders") },
        });
        return;
      }
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
    onError: (error) => {
      toast.error(orderErrorMessage(error, "Không thể hủy đơn hàng"));
    },
  });
}

/** Tạo phiên thanh toán (bank_transfer/qr_transfer) cho một order — chỉ gọi được 1 lần khi order còn "pending". */
export function useCreatePaymentIntent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentIntentDTO }) =>
      orderService.createPaymentIntent(id, data),
    onError: (error) => {
      // Đơn hết hạn: backend vừa chuyển đơn sang "expired" nên làm mới danh sách; hộp thanh toán
      // tự hiện thông báo + nút "Tạo đơn mới", không toast thêm cho trùng lặp.
      if (isOrderExpiredError(error)) {
        qc.invalidateQueries({ queryKey: orderKeys.mine() });
        return;
      }
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
      // Làm mới ngay trạng thái thanh toán để dialog chuyển màn thành công
      // mà không phải chờ nhịp poll kế tiếp.
      qc.invalidateQueries({ queryKey: orderKeys.paymentStatus(id) });
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
