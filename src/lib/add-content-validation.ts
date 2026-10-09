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

// ─── Bài viết (ARTICLE) — QA 261008 T1/T7, contract C1 ───────────────────────────────────────────

export const ARTICLE_BODY_REQUIRED_MESSAGE = "Vui lòng nhập nội dung bài viết.";
/** Giới hạn của backend (`maxArticleBodyChars`) — vượt thì trả 400 `ARTICLE_BODY_TOO_LONG`. */
export const MAX_ARTICLE_BODY_CHARS = 200000;
export const ARTICLE_BODY_TOO_LONG_MESSAGE = `Nội dung bài viết quá dài (tối đa ${MAX_ARTICLE_BODY_CHARS.toLocaleString("vi-VN")} ký tự).`;

// Thẻ tự nó là nội dung dù không có chữ — bỏ chúng đi sẽ coi bài chỉ có ảnh là "trống".
const CONTENT_BEARING_TAG = /<(img|hr|iframe|video|audio|table)\b/i;

/**
 * Tiptap phát ra `<p></p>` cho editor trống nên `body.trim() === ""` không đủ. Trống = không còn chữ
 * sau khi bỏ thẻ/`&nbsp;`, và không có thẻ nào tự mang nội dung (ảnh, đường kẻ, bảng).
 */
export function isArticleBodyBlank(html: string | null | undefined): boolean {
  if (!html) return true;
  if (CONTENT_BEARING_TAG.test(html)) return false;
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .trim();
  return text === "";
}

export interface ArticleFormErrors {
  title?: string;
  body?: string;
}

export function validateArticleForm(title: string, body: string): ArticleFormErrors {
  const errors: ArticleFormErrors = {};
  if (!title.trim()) errors.title = TITLE_REQUIRED_MESSAGE;
  if (isArticleBodyBlank(body)) errors.body = ARTICLE_BODY_REQUIRED_MESSAGE;
  // Đếm theo ký tự (code point), không phải đơn vị UTF-16 — backend đếm rune.
  else if (Array.from(body).length > MAX_ARTICLE_BODY_CHARS) errors.body = ARTICLE_BODY_TOO_LONG_MESSAGE;
  return errors;
}
