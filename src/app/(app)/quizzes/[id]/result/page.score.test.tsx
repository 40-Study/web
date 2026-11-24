/**
 * QA4 S1 (review #124): trang kết quả phải lấy mẫu số "Câu đúng" từ đề, không từ số câu đã trả lời.
 * Đề 3 câu, trả lời đúng 2, bỏ trống 1 -> "2/3" (trước đây "2/2"), và câu bỏ trống vẫn được liệt kê.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "quiz-1" }),
  useSearchParams: () => new URLSearchParams("attempt=att-1"),
}));
vi.mock("next/link", () => ({ default: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));

const answered = (id: string, text: string) => ({
  question_id: id,
  question_text: text,
  selected_answer_ids: [`${id}-a`],
  correct_answer_ids: [`${id}-a`],
  is_correct: true,
  points_earned: 1,
});
vi.mock("@/hooks/queries/use-quiz", () => ({
  useQuiz: () => ({ data: { title: "Đề thử", pass_percentage: 50 } }),
  useQuizAttemptDetail: () => ({
    isLoading: false,
    isError: false,
    data: { percentage: 67, is_passed: true, time_spent_seconds: 30, answers: [answered("q1", "Câu một"), answered("q2", "Câu hai")] },
  }),
  useQuizQuestions: () => ({
    data: [
      { id: "q1", question_text: "Câu một", display_order: 0, answers: [{ id: "q1-a", answer_text: "A1" }] },
      { id: "q2", question_text: "Câu hai", display_order: 1, answers: [{ id: "q2-a", answer_text: "A2" }] },
      { id: "q3", question_text: "Câu ba", display_order: 2, answers: [{ id: "q3-a", answer_text: "A3" }] },
    ],
  }),
}));

import QuizResultPage from "./page";

describe("QuizResultPage — mẫu số theo đề (S1)", () => {
  it("Câu đúng 2/3 và liệt kê câu chưa trả lời", () => {
    render(<QuizResultPage />);
    const card = screen.getByText("Câu đúng").closest("div.rounded-xl") as HTMLElement;
    expect(card.textContent).toContain("2/3");
    expect(screen.getByText("Câu ba")).toBeTruthy();
    expect(screen.getByText("Chưa trả lời.")).toBeTruthy();
  });
});
