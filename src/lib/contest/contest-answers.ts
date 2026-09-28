/**
 * Bài làm cuộc thi phía web: dựng payload nộp bài (§4.2) và lưu nháp cục bộ.
 *
 * Lưu nháp theo `attempt_id` trong localStorage: backend `start` idempotent (tải lại trang nhận
 * lại ĐÚNG attempt cũ) nhưng không lưu câu trả lời giữa chừng, nên thiếu nháp thì tải lại là mất
 * hết đáp án đã chọn. Đây chỉ là tiện ích của người đang làm bài — server không đọc, mọi đọc/ghi
 * bọc try/catch (chế độ riêng tư, bộ nhớ bị chặn) và thiếu nháp vẫn làm bài bình thường.
 *
 * Kèm bảng "id đáp án → chữ" để trang kết quả hiện chữ đáp án: `QuizAttemptAnswerDTO` của
 * my-result chỉ có id, và API quiz bị khoá với thí sinh (QUIZ_LOCKED_BY_CONTEST).
 */
import type { ContestAttemptQuestion, ContestSubmitAnswer } from "@/types/contest";

export interface ContestAnswerDraft {
  selected: string[];
  text: string;
}

export type ContestAnswerMap = Record<string, ContestAnswerDraft>;

export function isQuestionAnswered(draft: ContestAnswerDraft | undefined): boolean {
  return !!draft && (draft.selected.length > 0 || draft.text.trim().length > 0);
}

/** Chỉ gửi câu đã trả lời; câu bỏ trống backend tự tính 0 điểm (§4.2). */
export function buildSubmitAnswers(questions: ContestAttemptQuestion[], answers: ContestAnswerMap): ContestSubmitAnswer[] {
  const result: ContestSubmitAnswer[] = [];
  for (const q of questions) {
    const draft = answers[q.id];
    if (!isQuestionAnswered(draft)) continue;
    if (q.question_type === "fill_blank") {
      result.push({ question_id: q.id, text_answer: draft.text.trim() });
    } else {
      result.push({ question_id: q.id, selected_answer_ids: draft.selected });
    }
  }
  return result;
}

/** Chọn đáp án: câu một lựa chọn thay thế, câu nhiều lựa chọn bật/tắt. */
export function toggleAnswer(question: ContestAttemptQuestion, draft: ContestAnswerDraft | undefined, answerId: string): ContestAnswerDraft {
  const current = draft ?? { selected: [], text: "" };
  if (question.question_type !== "multiple_choice") return { ...current, selected: [answerId] };
  const selected = current.selected.includes(answerId)
    ? current.selected.filter((id) => id !== answerId)
    : [...current.selected, answerId];
  return { ...current, selected };
}

const DRAFT_PREFIX = "contest-draft:";
const ANSWER_TEXT_PREFIX = "contest-answer-text:";

export function loadAnswerDraft(attemptId: string): ContestAnswerMap {
  try {
    const raw = window.localStorage.getItem(DRAFT_PREFIX + attemptId);
    return raw ? (JSON.parse(raw) as ContestAnswerMap) : {};
  } catch {
    return {};
  }
}

export function saveAnswerDraft(attemptId: string, answers: ContestAnswerMap): void {
  try {
    window.localStorage.setItem(DRAFT_PREFIX + attemptId, JSON.stringify(answers));
  } catch {
    // Bộ nhớ bị chặn/đầy: bỏ qua, chỉ mất khả năng khôi phục khi tải lại trang.
  }
}

export function saveAnswerTexts(attemptId: string, questions: ContestAttemptQuestion[]): void {
  try {
    const texts: Record<string, string> = {};
    for (const q of questions) for (const a of q.answers) texts[a.id] = a.answer_text;
    window.localStorage.setItem(ANSWER_TEXT_PREFIX + attemptId, JSON.stringify(texts));
  } catch {
    // như trên
  }
}

export function loadAnswerTexts(attemptId: string): Map<string, string> {
  try {
    const raw = window.localStorage.getItem(ANSWER_TEXT_PREFIX + attemptId);
    return new Map(Object.entries(raw ? (JSON.parse(raw) as Record<string, string>) : {}));
  } catch {
    return new Map();
  }
}
