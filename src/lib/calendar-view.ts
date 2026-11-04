/**
 * Chế độ xem mặc định của lịch học theo bề rộng màn hình (P-06 / Q20, QA3 261104).
 * Lưới tuần 7 cột chia ~40px mỗi cột ở 390px nên tên lớp và giờ bị cắt ("08:3 – 11:3 Lớp F…"). Dưới 640px
 * mở ở chế độ NGÀY (một cột đọc được); người dùng vẫn đổi sang Tuần/Tháng bằng ô chọn chế độ xem.
 * Từ 640px trở lên giữ nguyên chế độ Tuần như trước.
 */
export const MOBILE_CALENDAR_MAX_WIDTH = 640;

export type DefaultCalendarView = "timeGridWeek" | "timeGridDay";

export function defaultCalendarView(viewportWidth: number): DefaultCalendarView {
  return viewportWidth < MOBILE_CALENDAR_MAX_WIDTH ? "timeGridDay" : "timeGridWeek";
}
