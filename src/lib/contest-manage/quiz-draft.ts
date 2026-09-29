/**
 * Bản nháp bài trắc nghiệm tạo riêng cho cuộc thi (contract §7: bước 1 của form dùng
 * `quizService.create` KHÔNG lesson_id/course_id + `quizService.createQuestion`).
 * Chỉ các loại câu chấm tự động được (§3.3): không có tự luận.
 *
 * `fill_blank` (điền khuyết): backend so `text_answer` với từng đáp án `is_correct=true` sau khi
 * chuẩn hoá (quy tắc điều phối chốt 29/09: bỏ khoảng trắng thừa, không phân biệt hoa thường, chuẩn
 * hoá NFC, GIỮ NGUYÊN dấu). Vì vậy mỗi "đáp án" của câu điền khuyết là một CÁCH VIẾT được chấp nhận
 * (vd có dấu và không dấu là hai cách khác nhau), và tất cả đều gửi `is_correct: true`.
 */

import type { CreateQuestionDTO } from "@/services/quiz.service";

export type ContestQuestionType = "single_choice" | "multiple_choice" | "true_false" | "fill_blank";

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
  fill_blank: "Điền khuyết",
};

export const FILL_BLANK_MAX_ACCEPTED = 10;

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
  if (type === "fill_blank") {
    return { text: "", type, points: "1", answers: [{ text: "", correct: true }] };
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
    if (q.type === "fill_blank") {
      // Điền khuyết: không có "đáp án sai"; chỉ cần ít nhất 1 cách viết được chấp nhận.
      if (q.answers.length === 0) return `${label}: cần ít nhất 1 đáp án được chấp nhận.`;
      if (q.answers.some((a) => !a.text.trim())) return `${label}: có đáp án được chấp nhận đang để trống.`;
      continue;
    }
    if (q.answers.length < 2) return `${label}: cần ít nhất 2 đáp án.`;
    if (q.answers.some((a) => !a.text.trim())) return `${label}: có đáp án đang để trống.`;
    const correct = q.answers.filter((a) => a.correct).length;
    if (correct === 0) return `${label}: chưa chọn đáp án đúng.`;
    if (q.type !== "multiple_choice" && correct !== 1) return `${label}: chỉ được 1 đáp án đúng.`;
  }
  return null;
}

export function toCreateQuestionDTO(q: QuestionDraft, index: number): CreateQuestionDTO {
  const isFillBlank = q.type === "fill_blank";
  return {
    question_text: q.text.trim(),
    question_type: q.type,
    points: Number(q.points),
    display_order: index + 1,
    answers: q.answers.map((a, i) => ({
      // Giữ đúng chữ và dấu người nhập (backend tự chuẩn hoá hoa thường/khoảng trắng lúc chấm);
      // chỉ bỏ khoảng trắng hai đầu cho gọn dữ liệu lưu.
      answer_text: a.text.trim(),
      is_correct: isFillBlank ? true : a.correct,
      display_order: i + 1,
    })),
  };
}
