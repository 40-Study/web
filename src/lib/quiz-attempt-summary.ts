/**
 * Gộp câu trả lời của một lượt làm với danh sách câu hỏi của đề (QA4 S1).
 *
 * Backend chỉ trả các câu ĐÃ trả lời trong attempt detail, nên mẫu số "Câu đúng"
 * và danh sách "Chi tiết từng câu" phải lấy từ đề: câu bỏ trống vẫn là một câu
 * của bài và hiện "Chưa trả lời". Thiếu đề (chưa tải xong) thì giữ nguyên
 * danh sách câu đã trả lời.
 */

export interface AttemptAnswerLike {
  question_id: string;
  question_text: string;
  selected_answer_ids: string[];
  correct_answer_ids?: string[] | null;
  is_correct?: boolean;
  points_earned: number;
  explanation?: string | null;
}

export interface QuestionLike {
  id: string;
  question_text: string;
  display_order?: number;
}

/** Câu hỏi theo thứ tự đề; câu không có trong lượt làm thành dòng bỏ trống. */
export function mergeAnswersWithQuestions(
  answers: ReadonlyArray<AttemptAnswerLike>,
  questions: ReadonlyArray<QuestionLike> | undefined
): AttemptAnswerLike[] {
  if (!questions || questions.length === 0) return [...answers];
  const byQuestion = new Map(answers.map((a) => [a.question_id, a] as const));
  const ordered = [...questions].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const merged: AttemptAnswerLike[] = ordered.map(
    (q) =>
      byQuestion.get(q.id) ?? {
        question_id: q.id,
        question_text: q.question_text,
        selected_answer_ids: [],
        points_earned: 0,
      }
  );
  // Câu đã trả lời nhưng không còn trong đề (đề bị sửa sau khi làm) vẫn được giữ.
  const known = new Set(ordered.map((q) => q.id));
  for (const a of answers) if (!known.has(a.question_id)) merged.push(a);
  return merged;
}

/** Số câu đúng và tổng số câu của bài (không phải số câu đã trả lời). */
export function summarizeAttempt(
  answers: ReadonlyArray<AttemptAnswerLike>,
  questions: ReadonlyArray<QuestionLike> | undefined
): { correct: number; total: number } {
  const merged = mergeAnswersWithQuestions(answers, questions);
  return { correct: merged.filter((a) => a.is_correct === true).length, total: merged.length };
}
