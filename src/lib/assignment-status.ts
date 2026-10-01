/**
 * Phân loại bài tập buổi live cho trang "Bài tập của tôi" (tab Sắp tới / Đang mở / Đã đóng).
 *
 * Dữ liệu thật (`GET /assignments?session_id=`, seed demo 2026-10-01): mỗi bài có `end_time`
 * (ISO, có múi giờ), `allow_late_submission`, `max_late_days`, `grace_period_minutes`;
 * `start_time` thường vắng. Code cũ không đọc `end_time` nên tab "Đã đóng" luôn rỗng.
 *
 * Luật (backend KHÔNG tự chặn nộp theo hạn — không có logic `EndTime` ở phần nộp bài, nên
 * đây là luật hiển thị phía web, dựa đúng vào các trường cấu hình nộp muộn):
 * - chưa công bố, hoặc `start_time` còn ở tương lai → `upcoming`
 * - quá thời điểm đóng → `ended`. Thời điểm đóng = `end_time` + `grace_period_minutes`
 *   + (`allow_late_submission` ? `max_late_days` ngày : 0)
 * - còn lại → `active` (kể cả đang trong khoảng nộp muộn — xem `isPastDue`)
 *
 * Một hàm trả MỘT trạng thái cho mỗi bài nên các tab loại trừ nhau theo cấu trúc.
 */

import type { AssignmentResponseDTO } from "@/services/assignment.service";

export type AssignmentStatus = "upcoming" | "active" | "ended";

type DeadlineFields = Pick<
  AssignmentResponseDTO,
  | "is_published"
  | "start_time"
  | "end_time"
  | "allow_late_submission"
  | "max_late_days"
  | "grace_period_minutes"
>;

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** Đọc mốc ISO; chuỗi rỗng / không hợp lệ → `null` (không đoán). */
function parseTime(value: string | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

/** Thời điểm hết nhận bài (ms), hoặc `null` nếu bài không có hạn. */
export function assignmentCloseAt(a: DeadlineFields): number | null {
  const end = parseTime(a.end_time);
  if (end === null) return null;
  const grace = Math.max(0, a.grace_period_minutes ?? 0) * MINUTE_MS;
  const late = a.allow_late_submission ? Math.max(0, a.max_late_days ?? 0) * DAY_MS : 0;
  return end + grace + late;
}

export function classifyAssignment(a: DeadlineFields, now: Date): AssignmentStatus {
  if (!a.is_published) return "upcoming";
  const start = parseTime(a.start_time);
  if (start !== null && start > now.getTime()) return "upcoming";
  const closeAt = assignmentCloseAt(a);
  if (closeAt !== null && now.getTime() > closeAt) return "ended";
  return "active";
}

/** Đã qua hạn chính (kể cả thời gian ân hạn) nhưng vẫn còn trong khoảng nộp muộn. */
export function isPastDue(a: DeadlineFields, now: Date): boolean {
  const end = parseTime(a.end_time);
  if (end === null) return false;
  const grace = Math.max(0, a.grace_period_minutes ?? 0) * MINUTE_MS;
  return now.getTime() > end + grace && classifyAssignment(a, now) === "active";
}
