/**
 * Đọc giờ bắt đầu/kết thúc của lịch học.
 *
 * Bối cảnh: `GET /me/timetable` và `GET /parent/children/:id/timetable` trả
 * `start_time`/`end_time` là timestamp ĐẦY ĐỦ (vd `2026-09-02T19:00:00+07:00`) —
 * ngày trong đó chỉ là ngày gốc của lịch lặp tuần, thứ thật nằm ở `day_of_week`.
 * Code cũ tách bằng `.split(":")` nên ra `NaN` và lịch hiện trống/lệch. Form nhập
 * lịch cá nhân thì vẫn dùng `HH:MM`, nên helper nhận CẢ HAI dạng.
 *
 * Timestamp được đổi sang giờ ĐỊA PHƯƠNG của trình duyệt (cùng quy ước với các
 * chỗ khác hiển thị thời gian); chuỗi `HH:MM` thì giữ nguyên như người dùng gõ.
 */

export interface ClockTime {
  hours: number;
  minutes: number;
}

// "HH:MM", "H:MM", "HH:MM:SS" hoặc "HH:MM:SS.ffffff" (kiểu TIME của Postgres).
const CLOCK_PATTERN = /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/;

/**
 * Đọc giờ/phút từ `HH:MM[:SS]` hoặc timestamp ISO.
 * Trả `null` khi không đọc được — người gọi phải bỏ qua mục đó thay vì vẽ `NaN`.
 */
export function parseClockTime(value: string | null | undefined): ClockTime | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const clock = CLOCK_PATTERN.exec(raw);
  if (clock) {
    const hours = Number(clock[1]);
    const minutes = Number(clock[2]);
    if (hours > 23 || minutes > 59) return null;
    return { hours, minutes };
  }

  // Chỉ nhận chuỗi có phần ngày "YYYY-MM-DD" — tránh `Date.parse` đoán bừa chuỗi rác.
  if (!/^\d{4}-\d{2}-\d{2}[T ]/.test(raw)) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return { hours: date.getHours(), minutes: date.getMinutes() };
}

/** Số phút tính từ 00:00, hoặc `null` khi không đọc được. */
export function clockTimeToMinutes(value: string | null | undefined): number | null {
  const time = parseClockTime(value);
  return time ? time.hours * 60 + time.minutes : null;
}

/** Hiển thị `HH:MM`; chuỗi rỗng khi không đọc được (không bao giờ hiện "NaN"). */
export function formatClockTime(value: string | null | undefined): string {
  const time = parseClockTime(value);
  if (!time) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(time.hours)}:${pad(time.minutes)}`;
}
