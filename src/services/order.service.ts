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
  expires_at?: string | null;
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
