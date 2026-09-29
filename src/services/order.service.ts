/**
 * Order service
 * Endpoints: /orders
 *
 * LƯU Ý: khác với phần lớn API khác, các handler order/payment KHÔNG dùng
 * envelope {message, data} — trả thẳng OrderResponse/PaymentIntentResponse…
 * ở top-level JSON. Đã đối chiếu internal/handler/order_handler.go và
 * internal/dto/orderDTO.go (2026-09-09).
 */

import { api } from "@/lib/api-client";

// ─── Types (khớp internal/dto/orderDTO.go) ─────────────────────────────────

export type OrderStatus =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled"
  | "refunded"
  | "expired";
export type OrderSource = "buy_now" | "cart";

/** Nhãn tiếng Việt DUY NHẤT cho trạng thái đơn (trang học viên + admin dùng chung). */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Chờ thanh toán",
  processing: "Đang chờ chuyển khoản",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn tiền",
  expired: "Hết hạn",
};

/** "14:05 28/09/2026" (định dạng vi-VN) theo giờ Việt Nam — ngày tạo/hạn đơn cần cả giờ, không chỉ ngày. */
export function formatOrderDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso));
}

/** Đơn còn mở (chưa thanh toán) — được tiếp tục thanh toán hoặc hủy nếu chưa quá hạn. */
export function isOrderOpen(order: Pick<Order, "status" | "expires_at">, now = Date.now()): boolean {
  if (order.status !== "pending" && order.status !== "processing") return false;
  return !order.expires_at || new Date(order.expires_at).getTime() > now;
}

export interface OrderItem {
  id: string;
  course_id: string;
  course_name: string;
  price: number;
  discount_amount: number;
  final_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: OrderStatus;
  payment_method?: string | null;
  payment_gateway?: string | null;
  paid_at?: string | null;
  coupon_id?: string | null;
  notes?: string | null;
  items: OrderItem[];
  created_at: string;
  /** Hạn giữ đơn còn mở — backend tính từ dữ liệu đã lưu (không tự gia hạn khi đọc lại). */
  expires_at?: string | null;
  /**
   * Đơn chưa hoàn tất từng được cấp mã chuyển khoản (review backend #76 vòng 4), nên có thể đã có
   * tiền về. Thẻ đơn đã huỷ có cờ này hiện nút "Kiểm tra thanh toán".
   */
  payment_code_issued?: boolean;
  /**
   * Đơn đã huỷ/hết hạn nhưng hệ thống nhận tiền cho mã của nó (quyết định chủ dự án, review #76
   * final): đơn KHÔNG được khôi phục, ForteX hoàn tiền thủ công. Thẻ đơn hiện dòng hoàn tiền, không
   * hiện nút "Kiểm tra thanh toán".
   */
  refund_needed?: boolean;
  /** Chỉ có khi đơn đã hoàn tiền (quyết định #1: ghi lý do + mã giao dịch chuyển khoản). */
  refund_reason?: string | null;
  refund_transaction_ref?: string | null;
  refunded_at?: string | null;
}

export interface OrderListResponse {
  orders: Order[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateOrderDTO {
  source: OrderSource;
  course_ids?: string[];
  coupon_code?: string;
  note?: string;
  idempotency_key: string;
}

export interface PaymentIntentDTO {
  payment_method: string;
  idempotency_key?: string;
}

export interface BankTransferInfo {
  bank_name: string;
  account_number: string;
  account_name: string;
  content: string;
}

export interface PaymentIntent {
  order_id: string;
  payment_code: string;
  qr_content?: string;
  bank_transfer_info?: BankTransferInfo;
  amount: number;
  currency: string;
  expired_at: string;
}

export interface PaymentStatus {
  order_id: string;
  status: string;
  paid_at?: string | null;
  amount: number;
  /**
   * Đơn "expired" nhưng hệ thống đã nhận tiền cho mã này sau hạn (backend ghi history để admin
   * hoàn tiền; cũng có với đơn đã huỷ). Đơn không được khôi phục: web báo "ForteX sẽ hoàn tiền cho
   * bạn", không mời tạo đơn mới rồi trả lần 2.
   */
  late_payment_received?: boolean;
  /**
   * Đơn "processing" chưa có kết quả đối chiếu cuối: mã đã hết hạn nhưng còn trong ân hạn 30 phút,
   * hoặc ngân hàng tạm lỗi (review backend #76 vòng 3). Không huỷ, không tạo đơn mới cho đơn này.
   */
  reconciling?: boolean;
  /**
   * Backend không đối chiếu được với ngân hàng (lỗi/timeout). Web báo "ngân hàng lỗi, thử lại sau",
   * không báo "chưa có giao dịch".
   */
  bank_unavailable?: boolean;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const orderService = {
  /** POST /orders — create order (buy_now or cart). 402 nếu khóa học cần thanh toán trước. */
  createOrder: (dto: CreateOrderDTO) => api.post<Order>("/orders", dto).then((r) => r.data),

  /** GET /orders/me?page=&limit=&status= */
  getMyOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<OrderListResponse>("/orders/me", { params }).then((r) => r.data),

  /** GET /orders/:id */
  getOrder: (id: string) => api.get<Order>(`/orders/${id}`).then((r) => r.data),

  /** POST /orders/:id/cancel */
  cancelOrder: (id: string, reason?: string) =>
    api.post<{ message: string }>(`/orders/${id}/cancel`, { reason }).then((r) => r.data),

  /** POST /orders/:id/payment-intent */
  createPaymentIntent: (id: string, data: PaymentIntentDTO) =>
    api.post<PaymentIntent>(`/orders/${id}/payment-intent`, data).then((r) => r.data),

  /** GET /orders/:id/payment-status */
  getPaymentStatus: (id: string) =>
    api.get<PaymentStatus>(`/orders/${id}/payment-status`).then((r) => r.data),

  /** POST /orders/:id/check-payment */
  checkPayment: (id: string) =>
    api.post<PaymentStatus>(`/orders/${id}/check-payment`, {}).then((r) => r.data),
};
