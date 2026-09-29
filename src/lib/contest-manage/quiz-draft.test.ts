/**
 * Bản nháp quiz cuộc thi — M2 (review 29/09): phải tạo được câu `fill_blank` (contract §3.3).
 * Backend chấm fill_blank bằng so khớp chính xác `text_answer` với các đáp án `is_correct=true`,
 * nên MỌI đáp án của câu điền khuyết phải gửi `is_correct: true`.
 */

import { describe, expect, it } from "vitest";

import { QUESTION_TYPE_LABEL, newQuestion, toCreateQuestionDTO, validateQuizDraft, type QuestionDraft } from "./quiz-draft";

function fill(answers: string[], text = "Thủ đô của Việt Nam là ___"): QuestionDraft {
  return { text, type: "fill_blank", points: "1", answers: answers.map((a) => ({ text: a, correct: true })) };
}

describe("fill_blank", () => {
  it("có trong danh sách loại câu với nhãn tiếng Việt", () => {
    expect(QUESTION_TYPE_LABEL.fill_blank).toBe("Điền khuyết");
  });

  it("câu mới có đúng 1 ô đáp án được chấp nhận", () => {
    expect(newQuestion("fill_blank").answers).toEqual([{ text: "", correct: true }]);
  });

  it("1 đáp án chấp nhận là đủ (không áp luật 'ít nhất 2 đáp án' của trắc nghiệm)", () => {
    expect(validateQuizDraft("QA-contest quiz", [fill(["Hà Nội"])])).toBeNull();
  });

  it("đáp án chấp nhận để trống → lỗi", () => {
    expect(validateQuizDraft("QA-contest quiz", [fill(["Hà Nội", "  "])])).toMatch(/Câu 1: .*để trống/);
  });

  it("gửi đúng shape backend: question_type fill_blank, mọi đáp án is_correct=true", () => {
    const q = fill(["Hà Nội", "Ha Noi"]);
    q.answers[1].correct = false; // state UI không được làm sai payload
    expect(toCreateQuestionDTO(q, 2)).toEqual({
      question_text: "Thủ đô của Việt Nam là ___",
      question_type: "fill_blank",
      points: 1,
      display_order: 3,
      answers: [
        { answer_text: "Hà Nội", is_correct: true, display_order: 1 },
        { answer_text: "Ha Noi", is_correct: true, display_order: 2 },
      ],
    });
  });
});

describe("trắc nghiệm vẫn giữ luật cũ", () => {
  it("một đáp án đúng mà chọn 2 → lỗi; chỉ 1 đáp án → lỗi", () => {
    const q = newQuestion("single_choice");
    q.text = "2+2?";
    q.answers = [
      { text: "4", correct: true },
      { text: "5", correct: true },
    ];
    expect(validateQuizDraft("QA-contest quiz", [q])).toMatch(/chỉ được 1 đáp án đúng/);
    q.answers = [{ text: "4", correct: true }];
    expect(validateQuizDraft("QA-contest quiz", [q])).toMatch(/ít nhất 2 đáp án/);
  });
});
