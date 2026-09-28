/**
 * API quản lý cuộc thi — giảng viên (quyền CONTESTS_MANAGE_OWN) và admin (CONTESTS_APPROVE_ALL).
 *
 * Path đúng router backend `internal/router/contest_routes.go` (nhánh feat/contest-b1-core):
 *  - Giảng viên: GET /contests/manage, /manage/quiz-options, /manage/:id, /manage/:id/participants;
 *    POST /contests; PUT/DELETE /contests/:id; POST /contests/:id/submit-review.
 *  - Admin: GET /admin/contests; POST /admin/contests/:id/{approve,reject,cancel,finalize};
 *    PUT /admin/contests/:id/prizes.
 * ĐÍNH CHÍNH 28/09: CHỈ admin chốt kết quả — service này không có hàm chốt cho giảng viên.
 * API công khai/thí sinh (danh sách, chi tiết, làm bài) thuộc lane W1 (`contest.service.ts`).
 */

import { api } from "@/lib/api-client";
import type {
  ContestFinalizeResult,
  ContestManage,
  ContestManageListParams,
  ContestPage,
  ContestParticipantRow,
  ContestPrizeInput,
  ContestQuizOption,
  ContestUpsertRequest,
} from "@/types/contest-manage";

type Envelope<T> = { message: string; data: T };

export const contestManageService = {
  // ── Giảng viên (và admin với cuộc thi của chính mình) ─────────────────────

  /** GET /contests/manage — cuộc thi do CHÍNH người gọi tạo. */
  listMine: (params?: ContestManageListParams) =>
    api
      .get<Envelope<ContestPage<ContestManage>>>("/contests/manage", { params })
      .then((r) => r.data.data),

  /** GET /contests/manage/quiz-options — quiz standalone đủ điều kiện gắn cuộc thi. */
  quizOptions: () =>
    api
      .get<Envelope<ContestQuizOption[]>>("/contests/manage/quiz-options")
      .then((r) => r.data.data),

  /** GET /contests/manage/:id — chủ hoặc admin; người khác nhận 404. */
  getManage: (id: string) =>
    api.get<Envelope<ContestManage>>(`/contests/manage/${id}`).then((r) => r.data.data),

  /** GET /contests/manage/:id/participants. */
  participants: (id: string, params?: { page?: number; limit?: number }) =>
    api
      .get<Envelope<ContestPage<ContestParticipantRow>>>(`/contests/manage/${id}/participants`, {
        params,
      })
      .then((r) => r.data.data),

  /** POST /contests — tạo DRAFT. */
  create: (body: ContestUpsertRequest) =>
    api.post<Envelope<ContestManage>>("/contests", body).then((r) => r.data.data),

  /** PUT /contests/:id — chỉ khi DRAFT/REJECTED; thay toàn bộ giải. */
  update: (id: string, body: ContestUpsertRequest) =>
    api.put<Envelope<ContestManage>>(`/contests/${id}`, body).then((r) => r.data.data),

  /** DELETE /contests/:id — chỉ khi DRAFT/REJECTED (xoá hẳn, giải phóng quiz). */
  remove: (id: string) => api.delete<Envelope<null>>(`/contests/${id}`).then((r) => r.data),

  /** POST /contests/:id/submit-review — DRAFT/REJECTED → PENDING_REVIEW. */
  submitReview: (id: string) =>
    api
      .post<Envelope<ContestManage>>(`/contests/${id}/submit-review`)
      .then((r) => r.data.data),

  // ── Admin ─────────────────────────────────────────────────────────────────

  /** GET /admin/contests — mọi cuộc thi trừ bản nháp của người khác. */
  adminList: (params?: ContestManageListParams) =>
    api
      .get<Envelope<ContestPage<ContestManage>>>("/admin/contests", { params })
      .then((r) => r.data.data),

  /**
   * POST /admin/contests/:id/approve. `prizes` undefined → giữ giải hiện có (backend nhận body
   * rỗng); có giá trị → thay toàn bộ giải (kèm voucher) trước khi công bố.
   */
  approve: (id: string, prizes?: ContestPrizeInput[]) =>
    api
      .post<Envelope<ContestManage>>(
        `/admin/contests/${id}/approve`,
        prizes === undefined ? undefined : { prizes }
      )
      .then((r) => r.data.data),

  /** POST /admin/contests/:id/reject — PENDING_REVIEW → REJECTED, bắt buộc lý do. */
  reject: (id: string, reason: string) =>
    api
      .post<Envelope<ContestManage>>(`/admin/contests/${id}/reject`, { reason })
      .then((r) => r.data.data),

  /** POST /admin/contests/:id/cancel — PENDING_REVIEW hoặc PUBLISHED chưa chốt → CANCELLED. */
  cancel: (id: string, reason: string) =>
    api
      .post<Envelope<ContestManage>>(`/admin/contests/${id}/cancel`, { reason })
      .then((r) => r.data.data),

  /** PUT /admin/contests/:id/prizes — PENDING_REVIEW/PUBLISHED chưa chốt. */
  updatePrizes: (id: string, prizes: ContestPrizeInput[]) =>
    api
      .put<Envelope<ContestManage>>(`/admin/contests/${id}/prizes`, { prizes })
      .then((r) => r.data.data),

  /** POST /admin/contests/:id/finalize — idempotent; lần 2 trả `already_finalized=true`. */
  finalize: (id: string) =>
    api
      .post<Envelope<ContestFinalizeResult>>(`/admin/contests/${id}/finalize`)
      .then((r) => r.data.data),
};
