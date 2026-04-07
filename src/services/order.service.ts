/**
 * Order service — real API calls for order management
 */

import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type OrderStatus = "pending" | "paid" | "cancelled" | "refunded";

export interface OrderItem {
  id: string;
  course_id: string;
  course: { id: string; title: string; price: number; thumbnail?: string };
  price: number;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total: number;
  discount: number;
  final_total: number;
  voucher_id?: string;
  voucher_code?: string;
  status: OrderStatus;
  payment_method?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateOrderDTO {
  course_ids: string[];
  voucher_code?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const orderService = {
  /**
   * POST /orders — create a new order
   */
  createOrder: (dto: CreateOrderDTO) =>
    api
      .post<{ message: string; data: Order }>("/orders", dto)
      .then((r) => r.data.data),

  /**
   * GET /orders/me — get current user's orders
   */
  getMyOrders: () =>
    api
      .get<{ message: string; data: Order[] }>("/orders/me")
      .then((r) => r.data.data),

  /**
   * GET /orders/:id — get a specific order by ID
   */
  getOrder: (id: string) =>
    api
      .get<{ message: string; data: Order }>(`/orders/${id}`)
      .then((r) => r.data.data),

  /**
   * POST /orders/:id/cancel — cancel an order
   */
  cancelOrder: (id: string) =>
    api
      .post<{ message: string }>(`/orders/${id}/cancel`, {})
      .then((r) => r.data),

  /**
   * POST /orders/:id/payment-intent — create Stripe payment intent
   */
  createPaymentIntent: (id: string) =>
    api
      .post<{ message: string; data: { client_secret: string } }>(`/orders/${id}/payment-intent`, {})
      .then((r) => r.data.data),

  /**
   * GET /orders/:id/payment-status — get payment status of an order
   */
  getPaymentStatus: (id: string) =>
    api
      .get<{ message: string; data: { status: string } }>(`/orders/${id}/payment-status`)
      .then((r) => r.data.data),

  /**
   * POST /orders/:id/check-payment — verify if order payment was completed
   */
  checkPayment: (id: string) =>
    api
      .post<{ message: string; data: { paid: boolean } }>(`/orders/${id}/check-payment`, {})
      .then((r) => r.data.data),
};
