/**
 * QA3 Q4: màn kết quả in "Đáp án c1000000" cho mọi lựa chọn nên đúng/sai không phân biệt được.
 * Có bảng id → chữ thì hiện chữ; thiếu thì nhãn trung tính, không bao giờ lộ id.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuizAttemptReview, UNKNOWN_ANSWER_LABEL } from "./quiz-attempt-review";
import { buildAnswerTextMap } from "@/lib/quiz-answer-text";

const answers = [
  {
    question_id: "q1",
    question_text: "1 + 1 = ?",
    selected_answer_ids: ["c1000000-aaaa"],
    correct_answer_ids: ["c2000000-bbbb"],
    is_correct: false,
    points_earned: 0,
  },
];

describe("QuizAttemptReview — chữ đáp án", () => {
  it("hiện chữ của lựa chọn và đáp án đúng khi có bảng id → chữ", () => {
    const answerText = buildAnswerTextMap([
      { answers: [{ id: "c1000000-aaaa", answer_text: "Ba" }, { id: "c2000000-bbbb", answer_text: "Hai" }] },
    ]);
    render(<QuizAttemptReview answers={answers} answerText={answerText} />);
    expect(screen.getByText("Ba")).toBeTruthy();
    expect(screen.getByText("Hai")).toBeTruthy();
    expect(screen.queryByText(/c1000000/)).toBeNull();
  });

  it("thiếu chữ thì nhãn trung tính, không có id thô", () => {
    const { container } = render(<QuizAttemptReview answers={answers} />);
    expect(screen.getAllByText(UNKNOWN_ANSWER_LABEL)).toHaveLength(2);
    expect(container.textContent).not.toMatch(/c1000000|c2000000/);
  });
});

describe("buildAnswerTextMap", () => {
  it("bỏ qua đáp án không có id, chịu được đề rỗng/undefined", () => {
    expect(buildAnswerTextMap(undefined).size).toBe(0);
    const m = buildAnswerTextMap([{ answers: [{ answer_text: "x" }, { id: "a", answer_text: "A" }] }]);
    expect([...m.entries()]).toEqual([["a", "A"]]);
  });
});
