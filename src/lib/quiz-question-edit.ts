/**
 * Sửa câu hỏi của quiz đã tạo (QA3 Q3-16): luật kiểm và dựng body `PUT /quizzes/:id/questions/:id`.
 * Backend (validateQuestionAnswers) cần: single_choice/true_false đúng 1 đáp án đúng, multiple_choice >= 1.
 */

import type { QuestionType, QuizAnswer, QuizQuestion } from "@/services/quiz.service";

export const CHOICE_QUESTION_TYPES: ReadonlyArray<QuestionType> = ["single_choice", "multiple_choice", "true_false"];

export const isChoiceQuestion = (type: QuestionType) => CHOICE_QUESTION_TYPES.includes(type);

export interface QuestionEditDraft {
  text: string;
  explanation: string;
  answers: Array<{ text: string; isCorrect: boolean }>;
}

export function questionToDraft(q: QuizQuestion): QuestionEditDraft {
  return {
    text: q.question_text,
    explanation: q.explanation ?? "",
    answers: [...q.answers]
      .sort((a, b) => a.display_order - b.display_order)
      .map((a) => ({ text: a.answer_text, isCorrect: a.is_correct === true })),
  };
}

/** Câu lỗi tiếng Việt đầu tiên, hoặc "" khi hợp lệ. */
export function validateQuestionDraft(type: QuestionType, draft: QuestionEditDraft): string {
  if (!draft.text.trim()) return "Nhập nội dung câu hỏi.";
  if (!isChoiceQuestion(type)) return "";
  const texts = draft.answers.map((a) => a.text.trim().toLocaleLowerCase());
  if (texts.length < 2 || texts.some((t) => !t)) return "Điền đầy đủ các phương án trả lời (tối thiểu 2).";
  if (new Set(texts).size !== texts.length) return "Các phương án trả lời không được trùng nhau.";
  const correct = draft.answers.filter((a) => a.isCorrect).length;
  if (correct === 0) return "Chọn đáp án đúng cho câu hỏi này.";
  if (type !== "multiple_choice" && correct > 1) return "Câu hỏi này chỉ có một đáp án đúng.";
  return "";
}

export function isDraftChanged(original: QuestionEditDraft, draft: QuestionEditDraft): boolean {
  return JSON.stringify(original) !== JSON.stringify(draft);
}

export interface UpdateQuestionBody {
  question_text: string;
  explanation: string;
  /** Chỉ câu trắc nghiệm: backend THAY toàn bộ đáp án; loại khác bỏ trường này để giữ nguyên. */
  answers?: QuizAnswer[];
}

export function buildUpdateQuestionBody(type: QuestionType, draft: QuestionEditDraft): UpdateQuestionBody {
  const body: UpdateQuestionBody = { question_text: draft.text.trim(), explanation: draft.explanation.trim() };
  if (isChoiceQuestion(type)) {
    body.answers = draft.answers.map((a, i) => ({ answer_text: a.text.trim(), is_correct: a.isCorrect, display_order: i + 1 }));
  }
  return body;
}
