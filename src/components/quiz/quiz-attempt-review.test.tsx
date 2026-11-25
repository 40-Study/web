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

// Round 2 (R1 / S5-11): backend trả câu bỏ trống KÈM đáp án đúng và giải thích sau khi nộp.
describe("QuizAttemptReview — câu bỏ trống có đáp án từ backend (S5-11)", () => {
  const questions = [{ id: "q3", question_text: "3 + 3 = ?", display_order: 0 }];
  const answerText = new Map([["a-six", "Sáu"]]);
  const skipped = {
    question_id: "q3",
    question_text: "3 + 3 = ?",
    selected_answer_ids: [] as string[],
    correct_answer_ids: ["a-six"],
    is_correct: false,
    points_earned: 0,
    explanation: "3 + 3 = 6.",
  };

  it("hiện 'Đáp án đúng' và giải thích cho câu chưa trả lời, không để dòng bỏ trống tự dựng đè lên", () => {
    render(<QuizAttemptReview answers={[skipped]} questions={questions} answerText={answerText} />);
    expect(screen.getByText("Chưa trả lời.")).toBeTruthy();
    expect(screen.getByText("Đáp án đúng:")).toBeTruthy();
    expect(screen.getByText("Sáu")).toBeTruthy();
    expect(screen.getByText("3 + 3 = 6.")).toBeTruthy();
  });

  it("`selected_answer_ids: null` (slice rỗng của Go) không làm hỏng màn xem lại", () => {
    const withNull = { ...skipped, selected_answer_ids: null as unknown as string[] };
    render(<QuizAttemptReview answers={[withNull]} answerText={answerText} />);
    expect(screen.getByText("Chưa trả lời.")).toBeTruthy();
    expect(screen.getByText("Bạn chọn:").nextSibling?.textContent).toBe("—");
    expect(screen.getByText("Sáu")).toBeTruthy();
  });
});

// QA6 C10: giảng viên tắt hiện đáp án -> backend trả null + answers_hidden; web không được hiện dấu đúng/sai.
describe("QuizAttemptReview — giảng viên ẩn đáp án (C10)", () => {
  const hidden = [
    {
      question_id: "q1",
      question_text: "1 + 1 = ?",
      selected_answer_ids: ["a1"],
      correct_answer_ids: null,
      explanation: null,
      is_correct: true,
      points_earned: 1,
    },
    {
      question_id: "q2",
      question_text: "2 + 2 = ?",
      selected_answer_ids: [],
      correct_answer_ids: null,
      explanation: null,
      points_earned: 0,
    },
  ];
  const text = new Map([["a1", "Hai"]]);

  it("hiện thông báo, không có 'Đáp án đúng', không có kết luận đúng/sai", () => {
    const { container } = render(<QuizAttemptReview answers={hidden} answerText={text} answersHidden />);
    expect(screen.getByText("Giảng viên đã ẩn đáp án của bài này")).toBeTruthy();
    expect(screen.queryByText("Đáp án đúng:")).toBeNull();
    expect(container.textContent).not.toMatch(/Đúng —|Chưa đúng/);
    expect(container.querySelector(".text-emerald-600, .text-rose-600")).toBeNull();
    expect(screen.getByText("Hai")).toBeTruthy();
    expect(screen.getByText("Chưa trả lời.")).toBeTruthy();
  });

  it("không hiện điểm từng câu (1 điểm / 0 điểm cũng là dấu đúng/sai)", () => {
    const { container } = render(<QuizAttemptReview answers={hidden} answerText={text} answersHidden />);
    expect(container.textContent).not.toMatch(/điểm/);
    // Câu bỏ trống vẫn nói rõ chưa trả lời; đó là việc có chọn hay chưa, không phải đúng/sai.
    expect(screen.getAllByText("Chưa trả lời.")).toHaveLength(1);
  });

  it("không có cờ answersHidden thì vẫn hiện đúng/sai như trước", () => {
    const { container } = render(<QuizAttemptReview answers={hidden} answerText={text} />);
    expect(screen.queryByText("Giảng viên đã ẩn đáp án của bài này")).toBeNull();
    expect(container.textContent).toMatch(/Đúng — 1 điểm/);
  });
});
