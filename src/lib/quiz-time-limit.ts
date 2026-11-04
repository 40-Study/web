/**
 * Giới hạn thời gian làm bài (phút) của quiz đã tạo (QA3 Q3-16). Backend `PUT /quizzes/:id` nhận
 * `time_limit_minutes` (số nguyên); vắng trường = giữ nguyên, nên KHÔNG có cách xoá giới hạn đã đặt.
 */

export const TIME_LIMIT_MAX_MINUTES = 600;

export const TIME_LIMIT_INVALID_MESSAGE = `Thời gian làm bài phải là số nguyên phút từ 1 đến ${TIME_LIMIT_MAX_MINUTES}.`;
export const TIME_LIMIT_CLEAR_UNSUPPORTED_MESSAGE =
  "Chưa hỗ trợ bỏ giới hạn thời gian đã đặt. Hãy nhập số phút mới.";

/** Trả câu lỗi cho ô ĐÃ ĐỔI; `hadValue` = quiz đang có giới hạn (xoá trắng ô là không hỗ trợ). */
export function validateTimeLimit(raw: string, hadValue: boolean): string | undefined {
  const value = raw.trim();
  if (value === "") return hadValue ? TIME_LIMIT_CLEAR_UNSUPPORTED_MESSAGE : undefined;
  const n = Number(value);
  return /^\d{1,4}$/.test(value) && n >= 1 && n <= TIME_LIMIT_MAX_MINUTES ? undefined : TIME_LIMIT_INVALID_MESSAGE;
}
