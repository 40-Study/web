/**
 * QA3 Q4: trang kết quả phải lấy chữ đáp án từ đề (id → chữ) để màn xem lại không in id thô.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "quiz-1" }),
  useSearchParams: () => new URLSearchParams("attempt=att-1"),
}));
vi.mock("next/link", () => ({ default: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));
vi.mock("@/hooks/queries/use-quiz", () => ({
  useQuiz: () => ({ data: { title: "Đề thử", pass_percentage: 50 } }),
  useQuizAttemptDetail: () => ({
    isLoading: false,
    isError: false,
    data: {
      percentage: 0,
      is_passed: false,
      time_spent_seconds: 5,
      answers: [
        {
          question_id: "q1",
          question_text: "Thủ đô Việt Nam?",
          selected_answer_ids: ["c1000000-wrong"],
          correct_answer_ids: ["c1000000-right"],
          is_correct: false,
          points_earned: 0,
        },
      ],
    },
  }),
  useQuizQuestions: () => ({
    data: [
      {
        answers: [
          { id: "c1000000-wrong", answer_text: "Huế" },
          { id: "c1000000-right", answer_text: "Hà Nội" },
        ],
      },
    ],
  }),
}));

import QuizResultPage from "./page";

describe("QuizResultPage — chữ đáp án (QA3 Q4)", () => {
  it("hiện chữ lựa chọn và đáp án đúng, khác nhau, không có 'Đáp án c1000000'", () => {
    const { container } = render(<QuizResultPage />);
    expect(screen.getByText("Huế")).toBeTruthy();
    expect(screen.getByText("Hà Nội")).toBeTruthy();
    expect(container.textContent).not.toMatch(/c1000000/);
  });
});
