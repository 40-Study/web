/**
 * Type cho trang QUẢN LÝ cuộc thi (giảng viên + admin) — lane W2.
 *
 * Bám đúng DTO backend thật (backend `internal/dto/contestDTO.go`, nhánh feat/contest-b1-core),
 * không bịa field. Hai điểm lệch contract có chủ đích:
 *  - Decimal (`total_points`, `score`, `percentage`, `certificate_min_percentage`) backend trả dạng
 *    NUMBER trong JSON (contract §2.1 ghi string) → khai `number`.
 *  - Contract §7 đặt type SSOT ở `types/contest.ts` (lane W1). Lúc W2 code, W1 chưa có file đó nên
 *    W2 giữ phần type quản lý ở file riêng này để không xung đột khi merge (W1 trước, W2 sau).
 *    Sau khi W1 merge: gộp các enum dùng chung (status/phase) về `@/types/contest`.
 */

export const CONTEST_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "REJECTED",
  "CANCELLED",
] as const;
export type ContestStatus = (typeof CONTEST_STATUSES)[number];

export const CONTEST_PHASES = [
  "DRAFT",
  "PENDING_REVIEW",
  "REJECTED",
  "CANCELLED",
  "UPCOMING",
  "ACTIVE",
  "ENDED",
  "FINALIZED",
] as const;
export type ContestPhase = (typeof CONTEST_PHASES)[number];

export type ContestAttemptStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

export function isContestStatus(value: string): value is ContestStatus {
  return (CONTEST_STATUSES as readonly string[]).includes(value);
}

export interface ContestVoucherAdmin {
  id: string;
  code: string;
  name: string;
}

export interface ContestPrizeAdmin {
  id: string;
  rank_from: number;
  rank_to: number;
  grant_certificate: boolean;
  voucher: ContestVoucherAdmin | null;
}

export interface ContestCourseBrief {
  id: string;
  title: string;
  slug: string;
}

export interface ContestQuizBrief {
  id: string;
  title: string;
  question_count: number;
}

/** GET /contests/manage/:id, /contests/manage, /admin/contests — `ContestManageDTO`. */
export interface ContestManage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  type: "QUIZ";
  status: ContestStatus;
  phase: ContestPhase;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  max_participants: number;
  participant_count: number;
  is_public: boolean;
  course: ContestCourseBrief | null;
  question_count: number;
  total_points: number;
  has_voucher_prize: boolean;
  creator_name: string;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
  prizes: ContestPrizeAdmin[];
  quiz: ContestQuizBrief | null;
  course_id: string | null;
  certificate_min_percentage: number | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reject_reason: string | null;
  cancel_reason: string | null;
  created_by: string;
  creator_email: string;
}

export interface ContestPage<T> {
  items: T[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

/** GET /contests/manage/quiz-options. */
export interface ContestQuizOption {
  id: string;
  title: string;
  question_count: number;
  total_points: number;
}

/** GET /contests/manage/:id/participants — một dòng. */
export interface ContestParticipantRow {
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  joined_at: string;
  attempt_status: ContestAttemptStatus;
  score: number | null;
  percentage: number | null;
  time_spent_seconds: number | null;
  submitted_at: string | null;
  rank: number | null;
}

export interface ContestPrizeInput {
  rank_from: number;
  rank_to: number;
  grant_certificate: boolean;
  voucher_id: string | null;
}

/** POST /contests, PUT /contests/:id — `ContestUpsertRequest`. */
export interface ContestUpsertRequest {
  title: string;
  description: string | null;
  banner_url: string | null;
  quiz_id: string;
  course_id: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  max_participants: number;
  is_public: boolean;
  certificate_min_percentage: number | null;
  prizes: ContestPrizeInput[];
}

/** POST /admin/contests/:id/finalize — `FinalizeResultDTO`. */
export interface ContestFinalizeResult {
  contest_id: string;
  finalized_at: string;
  already_finalized: boolean;
  ranked_count: number;
  award_count: number;
  certificate_count: number;
  voucher_count: number;
  notified_count: number;
}

export interface ContestManageListParams {
  status?: ContestStatus;
  phase?: ContestPhase;
  q?: string;
  page?: number;
  limit?: number;
}
