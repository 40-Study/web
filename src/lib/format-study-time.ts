/**
 * Định dạng tổng thời gian học từ số giây THẬT (cộng từ `lesson_progress.video_watched_seconds`
 * mà backend trả về ở trường `watched_seconds` của `GET /enrollments`).
 *
 * Tách khỏi trang `my-courses` để unit-test được các giá trị biên: trước đây trang này hiển thị
 * chuỗi cứng "1h 45m" cho mọi người học, nên không có gì để test.
 *
 * Quy ước hiển thị:
 * - Dưới 1 phút nhưng CÓ xem (1..59 giây) → "<1m", không phải "0m". "0m" chỉ dành cho đúng
 *   trường hợp chưa xem giây nào, nếu không người học xem 40 giây sẽ tưởng hệ thống không ghi nhận.
 * - Dưới 1 giờ → "Xm".
 * - Tròn giờ → "Xh" (không kèm "0m").
 * - Còn lại → "Xh Ym".
 *
 * Đầu vào rác (âm, NaN, Infinity, undefined) được quy về 0 thay vì in ra chuỗi vô nghĩa — backend
 * đã chặn giá trị âm ở tầng validate, đây là lớp phòng thủ thứ hai ở phía hiển thị.
 */
export function formatStudyTime(totalSeconds: number | null | undefined): string {
  if (typeof totalSeconds !== "number" || !Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "0m";
  }

  const seconds = Math.floor(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return minutes === 0 ? "<1m" : `${minutes}m`;
  }
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}
