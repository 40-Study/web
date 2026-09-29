/**
 * API quản lý cuộc thi — giảng viên (quyền CONTESTS_MANAGE_OWN) và admin (CONTESTS_APPROVE_ALL).
 *
 * Path đúng router backend `internal/router/contest_routes.go` (nhánh feat/contest-b1-core):
 *  - Giảng viên: GET /contests/manage, /manage/quiz-options, /manage/:id, /manage/:id/participants;
 *    POST /contests; PUT/DELETE /contests/:id; POST /contests/:id/submit-review.
 *  - Admin: GET /admin/contests; POST /admin/contests/:id/{approve,reject,cancel,finalize};
 *    PUT /admin/contests/:id/prizes.
 * ĐÍNH CHÍNH 28/09: CHỈ admin chốt kết quả — service này không có hàm chốt cho giảng viên.
 *
 * Dùng `contestRequest` của W1 (`contest.service.ts`) để lỗi 403/404 giữ nguyên `code` nghiệp vụ
 * (`CONTEST_FORBIDDEN`, `CONTEST_NOT_FOUND`) — interceptor chung làm rơi mã này.
 */

import { contestRequest } from "@/services/contest.service";
import type {
  ContestFinalizeResult,
  ContestManage,
  ContestPage,
  ContestParticipantRow,
  ContestPhase,
  ContestPrizeInput,
  ContestQuizOption,
  ContestStatus,
  ContestUpsertRequest,
} from "@/types/contest";

/** Query của GET /contests/manage và GET /admin/contests (handler `listQuery`). */
export interface ContestManageListParams {
  status?: ContestStatus;
  phase?: ContestPhase;
  q?: string;
  page?: number;
  limit?: number;
}

export const contestManageService = {
  // ── Giảng viên (và admin với cuộc thi của chính mình) ─────────────────────

  /** GET /contests/manage — cuộc thi do CHÍNH người gọi tạo. */
  listMine: (params?: ContestManageListParams) =>
    contestRequest<ContestPage<ContestManage>>({ method: "GET", url: "/contests/manage", params }),

  /** GET /contests/manage/quiz-options — quiz standalone đủ điều kiện gắn cuộc thi. */
  quizOptions: () =>
    contestRequest<ContestQuizOption[]>({ method: "GET", url: "/contests/manage/quiz-options" }),

  /** GET /contests/manage/:id — chủ hoặc admin; người khác nhận 404. */
  getManage: (id: string) => contestRequest<ContestManage>({ method: "GET", url: `/contests/manage/${id}` }),

  /** GET /contests/manage/:id/participants. */
  participants: (id: string, params?: { page?: number; limit?: number }) =>
    contestRequest<ContestPage<ContestParticipantRow>>({
      method: "GET",
      url: `/contests/manage/${id}/participants`,
      params,
    }),

  /** POST /contests — tạo DRAFT. */
  create: (body: ContestUpsertRequest) =>
    contestRequest<ContestManage>({ method: "POST", url: "/contests", data: body }),

  /** PUT /contests/:id — chỉ khi DRAFT/REJECTED; thay toàn bộ giải. */
  update: (id: string, body: ContestUpsertRequest) =>
    contestRequest<ContestManage>({ method: "PUT", url: `/contests/${id}`, data: body }),

  /** DELETE /contests/:id — chỉ khi DRAFT/REJECTED (xoá hẳn, giải phóng quiz). */
  remove: (id: string) => contestRequest<null>({ method: "DELETE", url: `/contests/${id}` }),

  /** POST /contests/:id/submit-review — DRAFT/REJECTED → PENDING_REVIEW. */
  submitReview: (id: string) =>
    contestRequest<ContestManage>({ method: "POST", url: `/contests/${id}/submit-review` }),

  // ── Admin ─────────────────────────────────────────────────────────────────

  /** GET /admin/contests — mọi cuộc thi trừ bản nháp của người khác. */
  adminList: (params?: ContestManageListParams) =>
    contestRequest<ContestPage<ContestManage>>({ method: "GET", url: "/admin/contests", params }),

  /**
   * POST /admin/contests/:id/approve. `prizes` undefined → giữ giải hiện có (backend nhận body
   * rỗng); có giá trị → thay toàn bộ giải (kèm voucher) trước khi công bố.
   */
  approve: (id: string, prizes?: ContestPrizeInput[]) =>
    contestRequest<ContestManage>({
      method: "POST",
      url: `/admin/contests/${id}/approve`,
      data: prizes === undefined ? undefined : { prizes },
    }),

  /** POST /admin/contests/:id/reject — PENDING_REVIEW → REJECTED, bắt buộc lý do. */
  reject: (id: string, reason: string) =>
    contestRequest<ContestManage>({ method: "POST", url: `/admin/contests/${id}/reject`, data: { reason } }),

  /** POST /admin/contests/:id/cancel — PENDING_REVIEW hoặc PUBLISHED chưa chốt → CANCELLED. */
  cancel: (id: string, reason: string) =>
    contestRequest<ContestManage>({ method: "POST", url: `/admin/contests/${id}/cancel`, data: { reason } }),

  /** PUT /admin/contests/:id/prizes — PENDING_REVIEW/PUBLISHED chưa chốt. */
  updatePrizes: (id: string, prizes: ContestPrizeInput[]) =>
    contestRequest<ContestManage>({ method: "PUT", url: `/admin/contests/${id}/prizes`, data: { prizes } }),

  /** POST /admin/contests/:id/finalize — idempotent; lần 2 trả `already_finalized=true`. */
  finalize: (id: string) =>
    contestRequest<ContestFinalizeResult>({ method: "POST", url: `/admin/contests/${id}/finalize` }),
};
