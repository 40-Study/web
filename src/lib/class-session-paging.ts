import type { ClassSession } from "@/services/session.service";

/** "YYYY-MM-DD" của hôm nay theo giờ Việt Nam. */
function vnToday(now: Date): string {
  return now.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

/**
 * Q8-T06: danh sách buổi học của lớp xếp cũ trước, nên lớp 104 buổi mở ở "Trang 1/6" còn hôm nay nằm ở trang 5. Trả về
 * trang (đếm từ 1) chứa buổi gần nhất từ hôm nay trở đi; lớp đã dạy hết (không còn buổi từ hôm nay) thì trang cuối.
 * `date` là ngày thuần hoặc RFC3339 nửa đêm: chỉ lấy phần ngày (cùng quy ước với vn-datetime), không qua `new Date`.
 */
export function pageContainingToday(
  sessions: Pick<ClassSession, "date">[],
  pageSize: number,
  now: Date = new Date(),
): number {
  const lastPage = Math.max(1, Math.ceil(sessions.length / pageSize));
  const today = vnToday(now);
  const firstFromToday = sessions.findIndex((s) => s.date.slice(0, 10) >= today);
  return firstFromToday === -1 ? lastPage : Math.floor(firstFromToday / pageSize) + 1;
}
