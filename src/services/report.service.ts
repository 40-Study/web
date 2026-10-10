/**
 * Report service — content violation reports
 * Endpoints: /reports
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

// Backend gửi reported_type = course|user|discussion (xem demo_moderation.go / report DTO). Trước
// đây union thiếu "discussion" nên nhãn trong REPORTED_TYPE_LABEL không bao giờ được dùng tới.
export type ReportedType = "course" | "review" | "user" | "comment" | "lesson" | "discussion";
export type ReportReason = "spam" | "inappropriate" | "copyright" | "harassment" | "other";
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporter_id: string;
  reported_type: ReportedType;
  reported_id: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  admin_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at?: string;
  updated_at?: string;
  reporter?: {
    id: string;
    name: string;
  };
}

export interface CreateReportDTO {
  reported_type: ReportedType;
  reported_id: string;
  reason: ReportReason;
  description?: string;
}

export interface UpdateReportStatusDTO {
  status: ReportStatus;
  admin_notes?: string;
}

/**
 * Khớp đúng backend/internal/dto/report_dto.go ReportListDTO: field JSON là "data", KHÔNG phải
 * "reports". Bug trước đây (chưa từng có consumer nào dùng tới nên chưa lộ ra): field sai tên
 * khiến mọi lần gọi list()/getMyReports() đều trả mảng rỗng dù backend có dữ liệu thật — phát
 * hiện khi build trang /admin/moderation (A-P2-5) và thấy danh sách luôn trống dù đã tạo report
 * thật, tái hiện bằng gọi thẳng GET /reports và so JSON field.
 */
export interface ReportListResponse {
  data: Report[];
  total: number;
  page: number;
  page_size: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const reportService = {
  /** POST /reports — create report */
  create: (data: CreateReportDTO) =>
    api.post<R<Report>>("/reports", data).then((r) => r.data.data),

  /** GET /reports/my — get my reports */
  getMyReports: (params?: { page?: number; page_size?: number }) =>
    api
      .get<R<ReportListResponse>>("/reports/my", { params })
      .then((r) => r.data.data),

  /** GET /reports — list all reports (admin) */
  list: (params?: { page?: number; page_size?: number; status?: ReportStatus; reported_type?: ReportedType }) =>
    api
      .get<R<ReportListResponse>>("/reports", { params })
      .then((r) => r.data.data),

  /** GET /reports/:id — get report by ID */
  getById: (id: string) =>
    api.get<R<Report>>(`/reports/${id}`).then((r) => r.data.data),

  /** PUT /reports/:id/status — update report status (admin) */
  updateStatus: (id: string, data: UpdateReportStatusDTO) =>
    api.put<R<Report>>(`/reports/${id}/status`, data).then((r) => r.data.data),

  /** DELETE /reports/:id — delete report */
  delete: (id: string) =>
    api.delete<R<null>>(`/reports/${id}`).then((r) => r.data),
};
