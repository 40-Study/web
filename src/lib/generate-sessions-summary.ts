/**
 * Q4-T06: "Sinh buổi học" từng báo "Đã tạo 1 buổi học" trong khi lặng lẽ bỏ qua buổi trùng giờ với lớp khác của
 * giảng viên. Backend nay trả `skipped: [{ date, reason }]` (hợp đồng QA4 #4); câu báo nói rõ buổi nào bị bỏ.
 */

export type SkippedSessionReason = "overlap" | "duplicate" | "cancelled";

export interface SkippedSession {
  /** YYYY-MM-DD */
  date: string;
  reason: SkippedSessionReason | string;
}

const REASON_LABEL: Record<string, string> = {
  overlap: "trùng lịch",
  duplicate: "đã tồn tại",
  // backend#149: buổi của lịch lặp ngày đó đã bị huỷ có chủ ý, không sinh lại.
  cancelled: "đã huỷ",
};
const UNKNOWN_REASON_LABEL = "(không rõ lý do)";

/** "2026-11-30" -> "30/11"; chuỗi lạ giữ nguyên. */
function shortDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  return m ? `${m[3]}/${m[2]}` : ymd;
}

function groupByReason(skipped: readonly SkippedSession[]): Map<string, string[]> {
  const byReason = new Map<string, string[]>();
  for (const s of skipped) {
    const label = REASON_LABEL[s.reason] ?? UNKNOWN_REASON_LABEL;
    byReason.set(label, [...(byReason.get(label) ?? []), s.date]);
  }
  // Sắp tăng dần theo YYYY-MM-DD để "3 ngày đầu" không phụ thuộc thứ tự backend trả về.
  return new Map(Array.from(byReason, ([label, dates]) => [label, dates.sort().map(shortDate)]));
}

/** Số ngày liệt kê tối đa cho mỗi lý do; phần còn lại gộp thành "(+N)". */
const MAX_LISTED_DATES = 3;

/** "05/01, 07/01, 12/01 (+101)" */
function listDates(dates: readonly string[]): string {
  const listed = dates.slice(0, MAX_LISTED_DATES).join(", ");
  const rest = dates.length - MAX_LISTED_DATES;
  return rest > 0 ? `${listed} (+${rest})` : listed;
}

/** "104 ngày trùng lịch: 05/01, 07/01, 12/01 (+101)" */
const describeGroups = (byReason: Map<string, string[]>) =>
  Array.from(byReason, ([label, dates]) => `${dates.length} ngày ${label}: ${listDates(dates)}`).join("; ");

/**
 * Câu toast sau khi sinh buổi: "Đã tạo 1 buổi học. Bỏ qua 1 ngày trùng lịch: 30/11".
 * Q9-T-07: chỉ tóm tắt (số ngày + vài ngày đầu + "(+N)"), không liệt kê hết hàng trăm ngày.
 */
export function generateSessionsSummary(createdCount: number, skipped: readonly SkippedSession[] = []): string {
  const created = `Đã tạo ${createdCount} buổi học`;
  if (skipped.length === 0) return created;
  return `${created}. Bỏ qua ${describeGroups(groupByReason(skipped))}`;
}

/**
 * backend#149: mọi ngày đều bị bỏ qua -> 409 kèm `skipped[]`. Cùng một lý do: "Bỏ qua tất cả 104 ngày trùng lịch:
 * 05/01, 07/01, 12/01 (+101)"; nhiều lý do thì liệt kê từng lý do.
 */
export function allSkippedSummary(skipped: readonly SkippedSession[]): string {
  const byReason = groupByReason(skipped);
  if (byReason.size === 1) {
    const [[label, dates]] = Array.from(byReason);
    return `Bỏ qua tất cả ${dates.length} ngày ${label}: ${listDates(dates)}`;
  }
  return `Không tạo được buổi nào. Bỏ qua ${describeGroups(byReason)}`;
}

/** `skipped[]` hợp lệ trong body lỗi (ApiError.responseBody), hoặc `null` nếu không có. */
export function skippedFromErrorPayload(payload: Record<string, unknown> | undefined): SkippedSession[] | null {
  const raw = payload?.skipped;
  if (!Array.isArray(raw)) return null;
  const items = raw.filter(
    (s): s is SkippedSession =>
      !!s && typeof s === "object" && typeof (s as SkippedSession).date === "string" && typeof (s as SkippedSession).reason === "string",
  );
  return items.length > 0 ? items : null;
}
