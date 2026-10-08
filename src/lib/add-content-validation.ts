/**
 * Kiểm tra form "Thêm nội dung bài học" phía client (QA 261008 T3/T4).
 *
 * Trước đây modal luôn gọi `onSubmit` rồi tự đóng, nên tiêu đề trống hay câu trắc nghiệm không có
 * đáp án đúng đều đi thẳng lên backend (400), modal mất sạch dữ liệu giáo viên vừa gõ. Hàm thuần ở
 * đây cho modal chặn lại tại chỗ và chỉ ra đúng ô sai.
 */

export const TITLE_REQUIRED_MESSAGE = "Vui lòng nhập tiêu đề.";
export const CORRECT_ANSWER_REQUIRED_MESSAGE = "Chọn đáp án đúng cho câu hỏi này.";

/** Phần tối thiểu của một câu trắc nghiệm mà việc kiểm tra cần. */
export interface ChoiceQuestionLike {
  id: string;
  correctId: string;
  options: { id: string }[];
}

export interface ContentFormErrors {
  title?: string;
  /** `questionId` -> thông báo; chỉ có khoá cho câu sai. */
  questions: Record<string, string>;
}

export function validateContentForm(
  title: string,
  questions: readonly ChoiceQuestionLike[]
): ContentFormErrors {
  const errors: ContentFormErrors = { questions: {} };
  if (!title.trim()) errors.title = TITLE_REQUIRED_MESSAGE;
  for (const q of questions) {
    // `correctId` phải trỏ tới một phương án CÒN TỒN TẠI; chuỗi rỗng là trạng thái ban đầu.
    if (!q.correctId || !q.options.some((o) => o.id === q.correctId)) {
      errors.questions[q.id] = CORRECT_ANSWER_REQUIRED_MESSAGE;
    }
  }
  return errors;
}

export function hasContentFormErrors(errors: ContentFormErrors): boolean {
  return Boolean(errors.title) || Object.keys(errors.questions).length > 0;
}
