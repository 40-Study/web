import { differenceInMinutes, format } from "date-fns";
import type { ScheduleEvent } from "@/components/schedule/week-calendar-grid";

/**
 * QA-B-13: ô thống kê từng cộng trên MỌI buổi đã tải (livestream tải 100 buổi không theo tuần), nên tuần đang
 * xem có 4 buổi / 9 giờ mà ô ghi "9 buổi / 16 giờ". Chỉ đếm buổi có ngày cụ thể nằm trong khoảng lịch đang
 * hiển thị (`range` là YYYY-MM-DD hai đầu, cùng khoảng gửi cho `/me/timetable`).
 * Sự kiện lặp tuần dạng mẫu (`weekly`, khi chưa biết khoảng) đại diện cho nhiều tuần nên không đếm.
 */
export function summarizeVisibleTeaching(
  events: ScheduleEvent[],
  range: { from: string; to: string } | undefined,
): { sessions: number; hours: number } {
  if (!range) return { sessions: 0, hours: 0 };
  const visible = events.filter((e) => {
    if (e.weekly) return false;
    const start = new Date(e.startTime);
    if (Number.isNaN(start.getTime())) return false;
    const day = format(start, "yyyy-MM-dd");
    return day >= range.from && day <= range.to;
  });
  const minutes = visible.reduce(
    (sum, e) => sum + Math.max(0, differenceInMinutes(new Date(e.endTime), new Date(e.startTime))),
    0,
  );
  // Làm tròn tới nửa giờ: 9,5 giờ không bị hiện thành 10 giờ.
  return { sessions: visible.length, hours: Math.round((minutes / 60) * 2) / 2 };
}
