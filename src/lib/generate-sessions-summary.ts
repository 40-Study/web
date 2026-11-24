/**
 * Q4-T06: "Sinh buổi học" từng báo "Đã tạo 1 buổi học" trong khi lặng lẽ bỏ qua buổi trùng giờ với lớp khác của
 * giảng viên. Backend nay trả `skipped: [{ date, reason }]` (hợp đồng QA4 #4); câu báo nói rõ buổi nào bị bỏ.
 */

export type SkippedSessionReason = "overlap" | "duplicate";

export interface SkippedSession {
  /** YYYY-MM-DD */
  date: string;
  reason: SkippedSessionReason | string;
}

const REASON_LABEL: Record<string, string> = {
  overlap: "trùng lịch",
  duplicate: "đã tồn tại",
};

/** "2026-11-30" -> "30/11"; chuỗi lạ giữ nguyên. */
function shortDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  return m ? `${m[3]}/${m[2]}` : ymd;
}

/** Câu toast sau khi sinh buổi: "Đã tạo 1 buổi học, bỏ qua 1 buổi trùng lịch (30/11)". */
export function generateSessionsSummary(createdCount: number, skipped: readonly SkippedSession[] = []): string {
  const created = `Đã tạo ${createdCount} buổi học`;
  if (skipped.length === 0) return created;
  const byReason = new Map<string, string[]>();
  for (const s of skipped) {
    const label = REASON_LABEL[s.reason] ?? "không tạo được";
    byReason.set(label, [...(byReason.get(label) ?? []), shortDate(s.date)]);
  }
  const parts = Array.from(byReason, ([label, dates]) => `${dates.length} buổi ${label} (${dates.join(", ")})`);
  return `${created}, bỏ qua ${parts.join("; ")}`;
}
