/**
 * Q4-T08: bài tập từng tạo và công bố được với hạn nộp đã qua (học viên nhận bài đã quá hạn ngay lúc giao).
 * Backend nay trả 400 ERR_DUE_DATE_IN_PAST; web chặn trước để giảng viên thấy lỗi ngay tại ô "Hạn nộp".
 */
export const DUE_DATE_IN_PAST_MESSAGE = "Hạn nộp phải ở tương lai.";

/** `true` khi có hạn nộp và hạn đó không sau thời điểm `now`. Không có hạn nộp thì hợp lệ. */
export function isDueDateInPast(due: string | undefined | null, now: Date = new Date()): boolean {
  if (!due) return false;
  const time = new Date(due).getTime();
  if (Number.isNaN(time)) return false;
  return time <= now.getTime();
}
