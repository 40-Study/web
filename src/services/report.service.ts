/**
 * Report service — content violation reports
 * Endpoints: /reports
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ReportedType = "course" | "review" | "user" | "comment" | "lesson";
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

export interface ReportListResponse {
  reports: Report[];
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
