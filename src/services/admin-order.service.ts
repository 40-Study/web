/**
 * Admin order service — đơn hàng admin + hoàn tiền
 * Endpoints: /orders/admin/* (quyền PAYMENTS_MANAGE, xem
 * plans/260927-2055-role-based-ux-qa/admin-features/phase-02-orders-refund.md)
 *
 * Khác với order.service.ts (endpoint /orders/* thường, KHÔNG có envelope) — nhóm
 * /orders/admin/* DÙNG envelope chuẩn {"message","data"} (đối chiếu
 * internal/handler/admin_order_handler.go 2026-09-28).
 */

import { api } from "@/lib/api-client";
import type { LateRefundSummary, Order, OrderStatus } from "@/services/order.service";

// ─── Types (khớp internal/dto/orderDTO.go AdminOrder*/RefundOrder*) ────────

export interface AdminOrderItemBrief {
  course_id: string;
  course_title: string;
  final_price: number;
}

export interface AdminOrderListItem {
  id: string;
  order_number: string;
  user_id: string;
  user_email: string;
  total_amount: number;
  currency: string;
  status: OrderStatus;
  payment_method?: string | null;
  created_at: string;
  paid_at?: string | null;
  items: AdminOrderItemBrief[];
  /** Đơn đã huỷ/hết hạn có tiền về cho mã của nó: admin cần hoàn tiền thủ công (không khôi phục). */
  refund_needed?: boolean;
  /** Admin đã ghi nhận hoàn xong khoản tiền về muộn: badge "Cần hoàn tiền" đổi thành "Đã hoàn tiền". */
  late_refunded_at?: string | null;
  /** Từng khoản tiền về muộn: số khoản chờ, tổng tiền, mã giao dịch (L6). nil khi đơn chưa có khoản nào. */
  late_refunds?: LateRefundSummary | null;
}

export interface AdminOrderListResponse {
  items: AdminOrderListItem[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AdminOrderListParams {
  status?: OrderStatus | "";
  user_id?: string;
  from?: string; // RFC3339
  to?: string; // RFC3339
  page?: number;
  limit?: number;
}

// Quyết định chủ dự án #1 (27/09/2026): hoàn tiền = admin xác nhận ĐÃ chuyển khoản thủ công
// NGOÀI hệ thống — KHÔNG hoàn vào ví xu. Chỉ 1 giá trị hợp lệ (khớp validate ở backend
// dto.RefundOrderRequest); giữ dạng union thay vì literal string để mở rộng dễ nếu quyết định
// đổi sau này, không phải vì hiện có lựa chọn thứ 2 nào khác đang hoạt động.
export type RefundMethod = "manual_bank_transfer";

export interface RefundOrderDTO {
  reason: string;
  refund_method: RefundMethod;
  /** Mã giao dịch chuyển khoản hoàn tiền (bắt buộc, quyết định #1 "kèm mã giao dịch"). */
  transaction_ref: string;
}

export interface RefundOrderResult {
  id: string;
  status: OrderStatus;
  refunded_at: string;
}

/**
 * POST /orders/admin/:id/late-refund — mọi trường đều tuỳ chọn (ghi chú, mã giao dịch chuyển khoản hoàn).
 * `refs`: các khoản (LateRefundItem.ref) vừa hoàn; bỏ trống = hoàn mọi khoản đang chờ. Chỉ khoản được nêu
 * bị tắt cờ, khoản còn lại vẫn cần hoàn.
 */
export interface LateRefundDTO {
  note?: string;
  transaction_ref?: string;
  refs?: string[];
}

export interface LateRefundResult {
  id: string;
  refund_needed: boolean;
  late_refunded_at: string;
  /** true khi đơn đã được ghi nhận hoàn từ trước (gọi lại không tạo thêm bản ghi). */
  already_recorded: boolean;
  /** Các khoản vừa được ghi hoàn trong lần gọi này. */
  refunded_refs?: string[];
  /** Số khoản còn chờ hoàn sau lần gọi (refund_needed = pending_count > 0). */
  pending_count?: number;
}

type Envelope<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const adminOrderService = {
  /** GET /orders/admin — danh sách toàn bộ đơn (mọi user), lọc theo AdminOrderListParams. */
  list: (params?: AdminOrderListParams) =>
    api
      .get<Envelope<AdminOrderListResponse>>("/orders/admin", { params })
      .then((r) => r.data.data),

  /** GET /orders/admin/:id — chi tiết đơn (tái dùng OrderResponse đầy đủ). */
  get: (id: string) =>
    api.get<Envelope<Order>>(`/orders/admin/${id}`).then((r) => r.data.data),

  /**
   * POST /orders/admin/:id/refund — xác nhận đã hoàn tiền (chuyển khoản thủ công ngoài hệ
   * thống, quyết định chủ dự án #1 — KHÔNG hoàn vào ví xu).
   */
  refund: (id: string, dto: RefundOrderDTO) =>
    api
      .post<Envelope<RefundOrderResult>>(`/orders/admin/${id}/refund`, dto)
      .then((r) => r.data.data),

  /**
   * POST /orders/admin/:id/late-refund — ghi nhận ĐÃ chuyển khoản hoàn khoản tiền về muộn của đơn đã
   * đóng (cờ refund_needed). Idempotent: gọi lại vẫn 200 với already_recorded = true.
   */
  markLateRefunded: (id: string, dto: LateRefundDTO) =>
    api
      .post<Envelope<LateRefundResult>>(`/orders/admin/${id}/late-refund`, dto)
      .then((r) => r.data.data),
};
