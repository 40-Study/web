/**
 * Bản nháp bài trắc nghiệm tạo riêng cho cuộc thi (contract §7: bước 1 của form dùng
 * `quizService.create` KHÔNG lesson_id/course_id + `quizService.createQuestion`).
 * Chỉ các loại câu chấm tự động được: cuộc thi từ chối quiz có câu tự luận (§3.3).
 */

import type { CreateQuestionDTO } from "@/services/quiz.service";

export type ContestQuestionType = "single_choice" | "multiple_choice" | "true_false";

export interface AnswerDraft {
  text: string;
  correct: boolean;
}

export interface QuestionDraft {
  text: string;
  type: ContestQuestionType;
  points: string;
  answers: AnswerDraft[];
}

export const QUESTION_TYPE_LABEL: Record<ContestQuestionType, string> = {
  single_choice: "Một đáp án đúng",
  multiple_choice: "Nhiều đáp án đúng",
  true_false: "Đúng / Sai",
};

export function newQuestion(type: ContestQuestionType = "single_choice"): QuestionDraft {
  if (type === "true_false") {
    return {
      text: "",
      type,
      points: "1",
      answers: [
        { text: "Đúng", correct: true },
        { text: "Sai", correct: false },
      ],
    };
  }
  return {
    text: "",
    type,
    points: "1",
    answers: [
      { text: "", correct: true },
      { text: "", correct: false },
    ],
  };
}

/** Lỗi đầu tiên của bản nháp, hoặc null khi hợp lệ. */
export function validateQuizDraft(title: string, questions: QuestionDraft[]): string | null {
  const t = title.trim();
  if (t.length < 3 || t.length > 255) return "Tên bài trắc nghiệm từ 3 đến 255 ký tự.";
  if (questions.length === 0) return "Cần ít nhất 1 câu hỏi.";
  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    const label = `Câu ${i + 1}`;
    if (!q.text.trim()) return `${label}: chưa nhập nội dung câu hỏi.`;
    const points = Number(q.points);
    if (!Number.isFinite(points) || points <= 0) return `${label}: điểm phải lớn hơn 0.`;
    if (q.answers.length < 2) return `${label}: cần ít nhất 2 đáp án.`;
    if (q.answers.some((a) => !a.text.trim())) return `${label}: có đáp án đang để trống.`;
    const correct = q.answers.filter((a) => a.correct).length;
    if (correct === 0) return `${label}: chưa chọn đáp án đúng.`;
    if (q.type !== "multiple_choice" && correct !== 1) return `${label}: chỉ được 1 đáp án đúng.`;
  }
  return null;
}

export function toCreateQuestionDTO(q: QuestionDraft, index: number): CreateQuestionDTO {
  return {
    question_text: q.text.trim(),
    question_type: q.type,
    points: Number(q.points),
    display_order: index + 1,
    answers: q.answers.map((a, i) => ({
      answer_text: a.text.trim(),
      is_correct: a.correct,
      display_order: i + 1,
    })),
  };
}
