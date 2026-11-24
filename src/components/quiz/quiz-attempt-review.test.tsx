/**
 * QA3 Q4: màn kết quả in "Đáp án c1000000" cho mọi lựa chọn nên đúng/sai không phân biệt được.
 * Có bảng id → chữ thì hiện chữ; thiếu thì nhãn trung tính, không bao giờ lộ id.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuizAttemptReview, UNKNOWN_ANSWER_LABEL } from "./quiz-attempt-review";
import { buildAnswerTextMap } from "@/lib/quiz-answer-text";
import { summarizeAttempt } from "@/lib/quiz-attempt-summary";

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

// QA4 S1: backend chỉ trả câu đã trả lời; mẫu số và danh sách phải theo đề.
describe("QuizAttemptReview + summarizeAttempt — câu bỏ trống (S1)", () => {
  const questions = [
    { id: "q1", question_text: "1 + 1 = ?", display_order: 0 },
    { id: "q2", question_text: "2 + 2 = ?", display_order: 1 },
    { id: "q3", question_text: "3 + 3 = ?", display_order: 2 },
  ];
  const answered = [
    { ...answers[0], is_correct: true },
    { question_id: "q2", question_text: "2 + 2 = ?", selected_answer_ids: ["x"], is_correct: true, points_earned: 1 },
  ];

  it("đếm trên tổng số câu của đề, không phải số câu đã trả lời", () => {
    expect(summarizeAttempt(answered, questions)).toEqual({ correct: 2, total: 3 });
    expect(summarizeAttempt([], questions)).toEqual({ correct: 0, total: 3 });
  });

  it("liệt kê câu chưa trả lời theo thứ tự đề", () => {
    render(<QuizAttemptReview answers={answered} questions={questions} />);
    expect(screen.getByText("3 + 3 = ?")).toBeTruthy();
    expect(screen.getByText("Chưa trả lời.")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("nộp 0 câu vẫn hiện đủ câu, không phải 'Chưa có dữ liệu'", () => {
    render(<QuizAttemptReview answers={[]} questions={questions} />);
    expect(screen.queryByText(/Chưa có dữ liệu chi tiết/)).toBeNull();
    expect(screen.getAllByText("Chưa trả lời.")).toHaveLength(3);
  });
});
