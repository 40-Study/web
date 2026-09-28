/**
 * Admin revenue report + platform fee setting
 * Endpoints: /admin/reports/revenue (quyền DASHBOARD_VIEW_GLOBAL),
 *            /admin/settings/platform-fee (quyền SYSTEM_SETTINGS_MANAGE)
 *
 * Thay thế hoàn toàn cách trang /admin/reports CŨ đọc useWalletTransactions() (ví của
 * NGƯỜI GỌI, không phải doanh thu nền tảng — xem qa-260927-admin.md). Đối chiếu
 * internal/handler/admin_order_handler.go (2026-09-28).
 */

import { api } from "@/lib/api-client";

// ─── Types (khớp internal/dto/orderDTO.go RevenueReportResponse/PlatformFeeSettingResponse) ─

export interface RevenueReport {
  gross_revenue: number;
  refund_amount: number;
  net_revenue: number;
  platform_fee_amount: number;
  teacher_share_amount: number;
  transaction_count: number;
  completed_count: number;
  refunded_count: number;
  success_rate: number;
  currency: string;
  by_status: Record<string, number>;
}

export interface RevenueReportParams {
  from?: string; // RFC3339 — mặc định 30 ngày gần nhất nếu bỏ trống
  to?: string; // RFC3339
}

export interface PlatformFeeSetting {
  platform_fee_percent: number;
}

type Envelope<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const adminReportService = {
  /** GET /admin/reports/revenue?from=&to= — doanh thu nền tảng thật, tính trực tiếp từ orders. */
  getRevenueReport: (params?: RevenueReportParams) =>
    api
      .get<Envelope<RevenueReport>>("/admin/reports/revenue", { params })
      .then((r) => r.data.data),

  /** GET /admin/settings/platform-fee — % phí nền tảng hiện hành (mặc định 0%). */
  getPlatformFee: () =>
    api
      .get<Envelope<PlatformFeeSetting>>("/admin/settings/platform-fee")
      .then((r) => r.data.data),

  /** PUT /admin/settings/platform-fee — đổi % (chỉ áp dụng đơn hoàn tất SAU thời điểm đổi). */
  updatePlatformFee: (percent: number) =>
    api
      .put<Envelope<PlatformFeeSetting>>("/admin/settings/platform-fee", {
        platform_fee_percent: percent,
      })
      .then((r) => r.data.data),
};
