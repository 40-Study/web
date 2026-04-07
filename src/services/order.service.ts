/**
 * Order service
 * Endpoints: /orders
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type OrderStatus = "pending" | "paid" | "cancelled" | "refunded";
export type OrderSource = "buy_now" | "cart";

export interface OrderItem {
  id: string;
  course_id: string;
  course?: { id: string; title: string; price: number; thumbnail?: string };
  price: number;
}

export interface Order {
  id: string;
  user_id: string;
  source: OrderSource;
  items: OrderItem[];
  total: number;
  discount: number;
  final_total: number;
  coupon_code?: string;
  note?: string;
  status: OrderStatus;
  payment_method?: string;
  created_at: string;
  updated_at?: string;
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
  idempotency_key: string;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const orderService = {
  /** POST /orders — create order (buy_now or cart) */
  createOrder: (dto: CreateOrderDTO) =>
    api.post<R<Order>>("/orders", dto).then((r) => r.data.data),

  /** GET /orders/me?page=&limit=&status= */
  getMyOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<R<Order[]>>("/orders/me", { params }).then((r) => r.data.data),

  /** GET /orders/:id */
  getOrder: (id: string) =>
    api.get<R<Order>>(`/orders/${id}`).then((r) => r.data.data),

  /** POST /orders/:id/cancel */
  cancelOrder: (id: string, reason?: string) =>
    api.post<R<null>>(`/orders/${id}/cancel`, { reason }).then((r) => r.data),

  /** POST /orders/:id/payment-intent */
  createPaymentIntent: (id: string, data: PaymentIntentDTO) =>
    api.post<R<{ client_secret: string }>>(`/orders/${id}/payment-intent`, data).then((r) => r.data.data),

  /** GET /orders/:id/payment-status */
  getPaymentStatus: (id: string) =>
    api.get<R<{ status: string }>>(`/orders/${id}/payment-status`).then((r) => r.data.data),

  /** POST /orders/:id/check-payment */
  checkPayment: (id: string) =>
    api.post<R<{ paid: boolean }>>(`/orders/${id}/check-payment`, {}).then((r) => r.data.data),
};
