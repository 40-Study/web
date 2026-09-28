/** Nhãn tiếng Việt + màu badge cho trạng thái/phase cuộc thi (trang quản lý). */

import type { ContestAttemptStatus, ContestPhase, ContestStatus } from "@/types/contest-manage";

export type BadgeVariant = "success" | "warning" | "destructive" | "outline" | "secondary" | "default";

export const CONTEST_STATUS_LABEL: Record<ContestStatus, string> = {
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ duyệt",
  PUBLISHED: "Đã công bố",
  REJECTED: "Bị từ chối",
  CANCELLED: "Đã huỷ",
};

export const CONTEST_PHASE_LABEL: Record<ContestPhase, string> = {
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ duyệt",
  REJECTED: "Bị từ chối",
  CANCELLED: "Đã huỷ",
  UPCOMING: "Sắp diễn ra",
  ACTIVE: "Đang diễn ra",
  ENDED: "Đã kết thúc, chờ chốt",
  FINALIZED: "Đã chốt kết quả",
};

export const CONTEST_PHASE_VARIANT: Record<ContestPhase, BadgeVariant> = {
  DRAFT: "outline",
  PENDING_REVIEW: "warning",
  REJECTED: "destructive",
  CANCELLED: "secondary",
  UPCOMING: "default",
  ACTIVE: "success",
  ENDED: "warning",
  FINALIZED: "success",
};

export const ATTEMPT_STATUS_LABEL: Record<ContestAttemptStatus, string> = {
  NOT_STARTED: "Chưa làm",
  IN_PROGRESS: "Đang làm",
  SUBMITTED: "Đã nộp",
  EXPIRED: "Hết giờ, không tính",
};

export function phaseLabel(phase: string): string {
  return (CONTEST_PHASE_LABEL as Record<string, string>)[phase] ?? phase;
}

export function phaseVariant(phase: string): BadgeVariant {
  return (CONTEST_PHASE_VARIANT as Record<string, BadgeVariant>)[phase] ?? "outline";
}
