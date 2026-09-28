/**
 * Bài làm cuộc thi phía web: dựng payload nộp bài (§4.2) và lưu nháp cục bộ.
 *
 * Lưu nháp theo `attempt_id` trong localStorage: backend `start` idempotent (tải lại trang nhận
 * lại ĐÚNG attempt cũ) nhưng không lưu câu trả lời giữa chừng, nên thiếu nháp thì tải lại là mất
 * hết đáp án đã chọn. Đây chỉ là tiện ích của người đang làm bài — server không đọc, mọi đọc/ghi
 * bọc try/catch (chế độ riêng tư, bộ nhớ bị chặn) và thiếu nháp vẫn làm bài bình thường.
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

/**
 * Xoá nháp sau khi nộp THÀNH CÔNG (review m3): nộp xong nháp vô dụng, và để lại thì bài làm nằm
 * trên máy dùng chung. Chỉ gọi khi nộp thành công — nộp lỗi (mạng) thì nháp phải còn để nộp lại.
 */
export function clearAnswerDraft(attemptId: string): void {
  try {
    window.localStorage.removeItem(DRAFT_PREFIX + attemptId);
  } catch {
    // Bộ nhớ bị chặn: không có gì để xoá.
  }
}

