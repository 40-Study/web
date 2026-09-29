/**
 * Type SSOT của tính năng "Cuộc thi" (contract §1.1, §2.1, §2.4 —
 * plans/260927-2055-role-based-ux-qa/contest-feature/contract.md). W2 import từ file này, không
 * khai lại. Shape chép theo DTO THẬT của backend (`internal/dto/contestDTO.go`, nhánh
 * feat/contest-b1-core), không theo trí nhớ.
 *
 * Lệch contract đã biết (B1 báo, web theo backend thật):
 * - Decimal (`score`, `total_points`, `percentage`, `certificate_min_percentage`, `points_earned`)
 *   trả về dạng NUMBER trong JSON (cmd/api bật `decimal.MarshalJSONWithoutQuotes`), không phải
 *   string như §2.1 viết. Kiểu `ContestDecimal` vẫn nhận string để một bản build backend khác
 *   cấu hình không làm vỡ màn hình (xem `toContestNumber`).
 */

// ─── Enum (§1.1) ───────────────────────────────────────────────────────────

export const CONTEST_STATUSES = ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "CANCELLED"] as const;
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

/** Phase được phép lọc ở danh sách công khai (handler `publicListPhases`). */
export const PUBLIC_CONTEST_PHASES = ["UPCOMING", "ACTIVE", "ENDED", "FINALIZED"] as const;
export type PublicContestPhase = (typeof PUBLIC_CONTEST_PHASES)[number];

export const CONTEST_ATTEMPT_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "EXPIRED"] as const;
export type ContestAttemptStatus = (typeof CONTEST_ATTEMPT_STATUSES)[number];

export const CONTEST_JOIN_BLOCK_REASONS = [
  "LOGIN_REQUIRED",
  "ROLE_NOT_ALLOWED",
  "OWNER",
  "COURSE_REQUIRED",
  "FULL",
  "CLOSED",
  "ALREADY_JOINED",
] as const;
export type ContestJoinBlockReason = (typeof CONTEST_JOIN_BLOCK_REASONS)[number];

/** Mã lỗi nghiệp vụ (§2.4) — `{message, code}` ở body lỗi. */
export const CONTEST_ERROR_CODES = [
  "INVALID_ID",
  "CONTEST_INVALID_SCHEDULE",
  "CONTEST_QUIZ_INVALID",
  "CONTEST_PRIZES_INVALID",
  "REASON_REQUIRED",
  "REASON_TOO_LONG",
  "CONTEST_FORBIDDEN",
  "CONTEST_ROLE_NOT_ALLOWED",
  "CONTEST_OWNER_CANNOT_JOIN",
  "CONTEST_COURSE_REQUIRED",
  "CONTEST_VOUCHER_ADMIN_ONLY",
  "CONTEST_NOT_JOINED",
  "CONTEST_LEADERBOARD_HIDDEN",
  "QUIZ_LOCKED_BY_CONTEST",
  "CONTEST_NOT_FOUND",
  "CONTEST_RESULT_NOT_FOUND",
  "CONTEST_CERTIFICATE_NOT_FOUND",
  "CONTEST_INVALID_STATUS",
  "CONTEST_START_PASSED",
  "CONTEST_QUIZ_IN_USE",
  "CONTEST_QUIZ_LOCKED",
  "CONTEST_CLOSED",
  "CONTEST_NOT_ACTIVE",
  "CONTEST_ALREADY_JOINED",
  "CONTEST_FULL",
  "CONTEST_ALREADY_SUBMITTED",
  "CONTEST_DEADLINE_PASSED",
  "CONTEST_ATTEMPT_MISMATCH",
  "CONTEST_NOT_ENDED",
  "CONTEST_VOUCHER_UNAVAILABLE",
] as const;
export type ContestErrorCode = (typeof CONTEST_ERROR_CODES)[number];

/** Decimal backend — thực tế là number (xem đầu file). */
export type ContestDecimal = number | string;

// ─── Response (§2.1) ───────────────────────────────────────────────────────

export interface ContestPage<T> {
  items: T[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ContestVoucherBrief {
  id: string;
  name: string;
}

export interface ContestVoucherAdmin extends ContestVoucherBrief {
  code: string;
}

export interface ContestPrize {
  id: string;
  rank_from: number;
  rank_to: number;
  grant_certificate: boolean;
  voucher: ContestVoucherBrief | null;
}

export interface ContestPrizeAdmin extends Omit<ContestPrize, "voucher"> {
  voucher: ContestVoucherAdmin | null;
}

export interface ContestCourseBrief {
  id: string;
  title: string;
  slug: string;
}

/** Phần chung Summary/Manage (`ContestBaseDTO`, Go embed nên JSON phẳng). */
export interface ContestBase {
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
  total_points: ContestDecimal;
  has_voucher_prize: boolean;
  creator_name: string;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContestSummary extends ContestBase {
  prizes: ContestPrize[];
}

export interface ContestAwardBrief {
  certificate_number: string | null;
  voucher: ContestVoucherAdmin | null;
}

export interface MyParticipation {
  joined_at: string;
  attempt_id: string | null;
  attempt_status: ContestAttemptStatus;
  started_at: string | null;
  deadline_at: string | null;
  submitted_at: string | null;
  score: ContestDecimal | null;
  total_points: ContestDecimal | null;
  percentage: ContestDecimal | null;
  time_spent_seconds: number | null;
  rank: number | null;
  award: ContestAwardBrief | null;
}

export interface ContestMySummary extends ContestSummary {
  my_participation: MyParticipation | null;
}

export interface ContestViewer {
  can_join: boolean;
  join_block_reason: ContestJoinBlockReason | null;
  my_participation: MyParticipation | null;
}

export interface ContestDetail extends ContestSummary {
  server_time: string;
  certificate_min_percentage: ContestDecimal | null;
  viewer: ContestViewer;
}

export interface ContestQuizBrief {
  id: string;
  title: string;
  question_count: number;
}

export interface ContestManage extends ContestBase {
  prizes: ContestPrizeAdmin[];
  quiz: ContestQuizBrief | null;
  course_id: string | null;
  certificate_min_percentage: ContestDecimal | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reject_reason: string | null;
  cancel_reason: string | null;
  created_by: string;
  creator_email: string;
}

export interface ContestQuizOption {
  id: string;
  title: string;
  question_count: number;
  total_points: ContestDecimal;
}

export interface ContestParticipantRow {
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  joined_at: string;
  attempt_status: ContestAttemptStatus;
  score: ContestDecimal | null;
  percentage: ContestDecimal | null;
  time_spent_seconds: number | null;
  submitted_at: string | null;
  rank: number | null;
}

/** `AttemptQuestionDTO` (quizDTO.go) — KHÔNG có field đáp án. */
export type ContestQuestionType = "single_choice" | "multiple_choice" | "true_false" | "fill_blank";

export interface ContestAttemptAnswerOption {
  id: string;
  answer_text: string;
  display_order: number;
}

export interface ContestAttemptQuestion {
  id: string;
  question_text: string;
  question_type: ContestQuestionType;
  points: ContestDecimal;
  display_order: number;
  image_url?: string;
  answers: ContestAttemptAnswerOption[];
}

export interface ContestStartResult {
  attempt_id: string;
  deadline_at: string;
  server_time: string;
  duration_minutes: number;
  questions: ContestAttemptQuestion[];
}

export interface ContestSubmitResult {
  attempt_id: string;
  score: ContestDecimal | null;
  total_points: ContestDecimal | null;
  percentage: ContestDecimal | null;
  time_spent_seconds: number | null;
  submitted_at: string | null;
}

/**
 * Một câu trong `my-result.questions` — chỉ có từ `answers_available_at` (ĐÍNH CHÍNH 2), trước
 * đó `questions = null`. ĐÍNH CHÍNH 3 (29/09) thêm `question_type`, `options`, `accepted_answers`
 * để web lấy CHỮ đáp án từ response thay vì tự nhớ ở localStorage.
 */
export interface ContestReviewAnswer {
  id: string;
  question_id: string;
  question_text: string;
  question_type: ContestQuestionType;
  /** Mọi lựa chọn của câu theo `display_order`; `fill_blank` luôn `[]`. Luôn có mặt. */
  options: ContestAttemptAnswerOption[];
  /** Chỉ `fill_blank`: các đáp án được chấp nhận; câu khác luôn `[]`. Luôn có mặt. */
  accepted_answers: string[];
  selected_answer_ids: string[] | null;
  text_answer?: string;
  is_correct?: boolean;
  points_earned: ContestDecimal;
  correct_answer_ids?: string[];
  explanation?: string;
}

export interface ContestMyResult {
  my_participation: MyParticipation | null;
  answers_available_at: string;
  questions: ContestReviewAnswer[] | null;
}

export interface ContestLeaderboardItem {
  rank: number;
  user_name: string;
  avatar_url: string | null;
  score: ContestDecimal;
  total_points: ContestDecimal;
  percentage: ContestDecimal;
  time_spent_seconds: number;
  submitted_at: string;
  is_me: boolean;
}

export interface ContestLeaderboardPage extends ContestPage<ContestLeaderboardItem> {
  finalized: boolean;
}

export interface ContestCertificate {
  certificate_number: string;
  user_name: string;
  contest_title: string;
  contest_slug: string;
  rank: number | null;
  issued_at: string;
}

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

// ─── Request (§2.1) ────────────────────────────────────────────────────────

export interface ContestPrizeInput {
  rank_from: number;
  rank_to: number;
  grant_certificate: boolean;
  voucher_id?: string | null;
}

export interface ContestUpsertRequest {
  title: string;
  description?: string | null;
  banner_url?: string | null;
  quiz_id: string;
  course_id?: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  max_participants: number;
  is_public: boolean;
  certificate_min_percentage?: number | null;
  prizes: ContestPrizeInput[];
}

export interface ContestReasonRequest {
  reason: string;
}

export interface ContestPrizesRequest {
  prizes: ContestPrizeInput[];
}

export interface ContestSubmitAnswer {
  question_id: string;
  selected_answer_ids?: string[];
  text_answer?: string;
}

export interface ContestSubmitRequest {
  attempt_id: string;
  answers: ContestSubmitAnswer[];
}

export interface ContestListParams {
  phase?: PublicContestPhase;
  course_id?: string;
  q?: string;
  page?: number;
  limit?: number;
}

/** Chuẩn hoá decimal backend (number, hoặc string ở bản build khác) sang number. */
export function toContestNumber(value: ContestDecimal | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}
