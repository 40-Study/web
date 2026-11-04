/**
 * Danh sách kiểm trước khi "Gửi duyệt" khoá học (QA3 Q3-09): ảnh bìa, mô tả, ít nhất 1 bài học.
 * Backend cũng chặn cùng các điều kiện này; kiểm ở client để giáo viên thấy thiếu gì NGAY, không phải
 * chờ lỗi 400/422. "Bài học có nội dung" do backend kiểm (422 COURSE_LESSON_NO_CONTENT, nêu tên từng bài).
 */

export interface SubmitChecklistInput {
  thumbnailUrl?: string | null;
  description?: string | null;
  /** Số bài học hiện có; `undefined` = chưa biết (chưa tải xong) -> không kết luận thiếu. */
  lessonCount?: number;
}

export interface SubmitChecklistItem {
  id: "cover" | "description" | "lesson";
  label: string;
  /** Ghi chú phụ (không tính vào việc đủ/thiếu). */
  hint?: string;
  /** `undefined` = chưa biết; chỉ `false` mới tính là thiếu. */
  done: boolean | undefined;
}

export function buildSubmitChecklist(input: SubmitChecklistInput): SubmitChecklistItem[] {
  return [
    { id: "cover", label: "Ảnh bìa khoá học", done: Boolean(input.thumbnailUrl?.trim()) },
    { id: "description", label: "Mô tả chi tiết", done: Boolean(input.description?.trim()) },
    {
      id: "lesson",
      label: "Ít nhất 1 bài học",
      hint: "mỗi bài học cần có nội dung",
      done: input.lessonCount === undefined ? undefined : input.lessonCount > 0,
    },
  ];
}

export function missingChecklistItems(items: SubmitChecklistItem[]): SubmitChecklistItem[] {
  return items.filter((item) => item.done === false);
}
