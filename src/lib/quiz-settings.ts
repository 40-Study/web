/**
 * Cài đặt chấm điểm của bài trắc nghiệm do giảng viên nhập (QA2 Q2-04): điểm đạt (%) và số lần làm tối đa.
 *
 * Trước đây save path ghi cứng 70 và 3. Hai ô đều BẮT BUỘC: backend `model.Quiz.MaxAttempts` có
 * `gorm:"default:5"`, nên vắng `max_attempts` KHÔNG có nghĩa "không giới hạn" mà là 5 — để trống rồi bỏ trường
 * sẽ lặng lẽ cho kết quả khác điều giảng viên thấy trên form.
 */

// Khoảng hợp lệ theo contract BE3 §5: pass_percentage 0..100, max_attempts 1..100 (không có "không giới hạn").
export const DEFAULT_QUIZ_PASS_PERCENTAGE = 70;
export const DEFAULT_QUIZ_MAX_ATTEMPTS = 3;

export const PASS_PERCENTAGE_INVALID_MESSAGE = "Điểm đạt phải là số từ 0 đến 100 (%).";
export const MAX_ATTEMPTS_INVALID_MESSAGE = "Số lần làm tối đa phải là số nguyên từ 1 đến 100.";

export interface QuizSettingsInput {
  passPercentage: string;
  maxAttempts: string;
}

export interface QuizSettingsErrors {
  passPercentage?: string;
  maxAttempts?: string;
}

// Chỉ chữ số (và tối đa 2 số lẻ cho %): loại "1e2", "-5", "abc" mà Number() sẽ nuốt.
const PERCENT_PATTERN = /^\d{1,3}(\.\d{1,2})?$/;
const INTEGER_PATTERN = /^\d{1,6}$/;

function isValidPassPercentage(raw: string): boolean {
  const value = raw.trim();
  if (!PERCENT_PATTERN.test(value)) return false;
  const n = Number(value);
  return n >= 0 && n <= 100;
}

function isValidMaxAttempts(raw: string): boolean {
  const value = raw.trim();
  const n = Number(value);
  return INTEGER_PATTERN.test(value) && n >= 1 && n <= 100;
}

export function validateQuizSettings(input: QuizSettingsInput): QuizSettingsErrors {
  const errors: QuizSettingsErrors = {};
  if (!isValidPassPercentage(input.passPercentage)) errors.passPercentage = PASS_PERCENTAGE_INVALID_MESSAGE;
  if (!isValidMaxAttempts(input.maxAttempts)) errors.maxAttempts = MAX_ATTEMPTS_INVALID_MESSAGE;
  return errors;
}

/** Chỉ gọi sau khi `validateQuizSettings` trả `{}`. */
export function parseQuizSettings(input: QuizSettingsInput): { pass_percentage: number; max_attempts: number } {
  return {
    pass_percentage: Number(input.passPercentage.trim()),
    max_attempts: Number(input.maxAttempts.trim()),
  };
}
