/**
 * Thời lượng bài học (phút) ở hộp thoại "Thêm bài học" (Q7-T01, hợp đồng C12).
 *
 * Trước đây ô chỉ có `min={0}` (thuộc tính không có `<form>` nên không bao giờ được kiểm) và `parseInt`
 * không kiểm: "-5", "2.5" (lặng lẽ thành 2) và "99999999999" đều được tạo, làm tổng thời lượng khoá sai.
 * Backend nay từ chối ngoài 0..1440 (400 `ERR_VALIDATION`); web chặn sớm cùng luật để không phải đợi 400.
 *
 * Tách khỏi `page.tsx` (1800+ dòng) để test được các giá trị biên mà không phải render cả trang.
 */

/** Một ngày: trần của một bài học (phút). Khớp C12. */
export const LESSON_MINUTES_MAX = 1440;

export const LESSON_MINUTES_ERROR = `Thời lượng phải là số phút nguyên từ 0 đến ${LESSON_MINUTES_MAX}.`;

export type LessonMinutesParse =
  /** Ô trống: không gửi khoá `duration_minutes` (khác với gửi 0). */
  | { kind: "empty" }
  | { kind: "valid"; minutes: number }
  | { kind: "invalid"; message: string };

export function parseLessonMinutes(input: string): LessonMinutesParse {
  const raw = input.trim();
  if (!raw) return { kind: "empty" };
  // Chỉ chữ số: loại "-5", "2.5", "1e3", "+4" (kể cả những gì `type="number"` vẫn cho gõ).
  if (!/^\d+$/.test(raw)) return { kind: "invalid", message: LESSON_MINUTES_ERROR };
  const minutes = Number(raw);
  if (!Number.isSafeInteger(minutes) || minutes > LESSON_MINUTES_MAX) {
    return { kind: "invalid", message: LESSON_MINUTES_ERROR };
  }
  return { kind: "valid", minutes };
}
