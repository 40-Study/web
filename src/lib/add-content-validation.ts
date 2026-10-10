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

// Phản chiếu `validateArticleBody` của backend (service/lesson_content_article_quiz.go) — backend là SSOT:
// bỏ khối <script>/<style>, bỏ thẻ, giải mã thực thể rồi cắt khoảng trắng; <img> là thẻ DUY NHẤT tự mang nội dung.
// (<hr>, bảng rỗng, iframe, video, audio KHÔNG tính: backend trả 400 ARTICLE_BODY_REQUIRED cho chúng.)
const SCRIPT_STYLE_BLOCK = /<(script|style)\b[\s\S]*?<\/(script|style)\s*>/gi;
const ANY_TAG = /<[^>]*>/g;
const IMAGE_TAG = /<img\b/i;
const WHITESPACE_ENTITIES = /&(?:nbsp|ensp|emsp|thinsp);/gi;
const NUMERIC_ENTITY = /&#(?:x([0-9a-f]+)|(\d+));/gi;

function decodeNumericEntities(text: string): string {
  return text.replace(NUMERIC_ENTITY, (match, hex?: string, dec?: string) => {
    const code = hex !== undefined ? parseInt(hex, 16) : parseInt(dec ?? "", 10);
    // Ngoài dải Unicode hợp lệ thì để nguyên (Go giữ nguyên thực thể không giải mã được).
    return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

/**
 * Tiptap phát ra `<p></p>` cho editor trống nên `body.trim() === ""` không đủ. Trống = không còn chữ nhìn thấy
 * (sau khi bỏ script/style, thẻ, giải mã thực thể) và không có <img> — cùng quy tắc với backend.
 */
export function isArticleBodyBlank(html: string | null | undefined): boolean {
  if (!html) return true;
  if (IMAGE_TAG.test(html)) return false;
  const text = decodeNumericEntities(
    html.replace(SCRIPT_STYLE_BLOCK, " ").replace(ANY_TAG, " ").replace(WHITESPACE_ENTITIES, " ")
  ).trim();
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
