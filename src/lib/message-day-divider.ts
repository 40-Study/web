/**
 * Vạch ngăn theo ngày trong khung chat (QA5 S5-13, Q5-T05): bong bóng chỉ in giờ (HH:mm) nên tin của nhiều
 * ngày trước nằm lẫn với tin hôm nay. Ngày tính theo giờ địa phương của người xem.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Khoá ngày địa phương (yyyy-m-d) của một mốc ISO; mốc hỏng -> `null` (không chèn vạch). */
export function messageDayKey(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Hôm nay", "Hôm qua", hoặc ngày đầy đủ dd/MM/yyyy. */
export function messageDayLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / DAY_MS);
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Nhãn vạch ngày cho từng tin (theo thứ tự cũ -> mới): chỉ tin đầu tiên của mỗi ngày có nhãn, còn lại `null`.
 * Mỗi ngày chỉ một vạch dù tin lạc thứ tự (tin tạm/realtime chen vào) làm ngày đó xuất hiện lại.
 */
export function dayDividerLabels(createdAts: ReadonlyArray<string>, now: Date = new Date()): Array<string | null> {
  const seen = new Set<string>();
  return createdAts.map((iso) => {
    const key = messageDayKey(iso);
    if (key === null || seen.has(key)) return null;
    seen.add(key);
    return messageDayLabel(iso, now);
  });
}
