/**
 * Nút nào được hiện theo trạng thái cuộc thi + vai trò — hàm thuần, phản chiếu máy trạng thái
 * backend (contract §3.1 + ĐÍNH CHÍNH 28/09). Web ẩn nút sai trạng thái để người dùng không bấm
 * rồi mới nhận 409; backend vẫn kiểm lại (điều kiện ở đây KHÔNG thay thế kiểm quyền server).
 */

import { CONTEST_FINALIZE_DELAY_MS } from "@/lib/contest-manage/form";
import type { ContestManage } from "@/types/contest";

type ContestLike = Pick<ContestManage, "status" | "phase" | "end_time" | "finalized_at" | "created_by">;

const EDITABLE = new Set(["DRAFT", "REJECTED"]);

export interface TeacherContestActions {
  canEdit: boolean;
  canDelete: boolean;
  canSubmitReview: boolean;
}

/**
 * Giảng viên (chủ cuộc thi): sửa/xoá/gửi duyệt chỉ ở DRAFT/REJECTED. KHÔNG có "chốt kết quả" —
 * ĐÍNH CHÍNH 28/09: chỉ admin chốt, kể cả cuộc thi không có giải voucher.
 */
export function getTeacherContestActions(contest: ContestLike): TeacherContestActions {
  const editable = EDITABLE.has(contest.status);
  return { canEdit: editable, canDelete: editable, canSubmitReview: editable };
}

export type FinalizeState =
  | { kind: "hidden" }
  | { kind: "wait"; availableAt: Date }
  | { kind: "ready" }
  | { kind: "done" };

/**
 * Trạng thái nút "Chốt kết quả" cho ADMIN.
 *  - hidden: cuộc thi chưa công bố hoặc chưa kết thúc (DRAFT/PENDING/REJECTED/CANCELLED/UPCOMING/ACTIVE).
 *  - wait: phase ENDED nhưng chưa qua `end_time + 60s` (backend trả 409 CONTEST_NOT_ENDED) — hiện
 *    nút khoá kèm giờ mở.
 *  - ready: bấm được. done: đã chốt.
 */
export function getFinalizeState(contest: ContestLike, now: Date): FinalizeState {
  if (contest.finalized_at || contest.phase === "FINALIZED") return { kind: "done" };
  if (contest.status !== "PUBLISHED" || contest.phase !== "ENDED") return { kind: "hidden" };
  const availableAt = new Date(new Date(contest.end_time).getTime() + CONTEST_FINALIZE_DELAY_MS);
  if (now.getTime() < availableAt.getTime()) return { kind: "wait", availableAt };
  return { kind: "ready" };
}

export interface AdminContestActions {
  canApprove: boolean;
  canReject: boolean;
  canCancel: boolean;
  canEditPrizes: boolean;
  finalize: FinalizeState;
}

/**
 * Admin: duyệt PENDING_REVIEW (hoặc DRAFT/REJECTED do CHÍNH admin tạo); từ chối chỉ PENDING_REVIEW;
 * huỷ PENDING_REVIEW hoặc PUBLISHED chưa chốt; sửa giải PENDING_REVIEW/PUBLISHED chưa chốt.
 */
export function getAdminContestActions(
  contest: ContestLike,
  viewerId: string | null | undefined,
  now: Date
): AdminContestActions {
  const notFinalized = !contest.finalized_at;
  const isOwner = !!viewerId && viewerId === contest.created_by;
  const pending = contest.status === "PENDING_REVIEW";
  const published = contest.status === "PUBLISHED";
  return {
    canApprove: pending || (isOwner && EDITABLE.has(contest.status)),
    canReject: pending,
    canCancel: pending || (published && notFinalized),
    canEditPrizes: (pending || published) && notFinalized,
    finalize: getFinalizeState(contest, now),
  };
}
