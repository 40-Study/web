/**
 * QA3 Q3-16: câu hỏi của quiz đã tạo phải sửa được (backend có PUT /quizzes/:id/questions/:id).
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { QuizQuestionsEditor } from "./quiz-questions-editor";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const QUESTIONS = [
  {
    id: "qq1",
    quiz_id: "q1",
    question_text: "1 + 1 = ?",
    question_type: "single_choice",
    explanation: "Cộng.",
    points: 10,
    display_order: 1,
    answers: [
      { answer_text: "1", is_correct: false, display_order: 1 },
      { answer_text: "2", is_correct: true, display_order: 2 },
      { answer_text: "3", is_correct: false, display_order: 3 },
    ],
  },
  {
    id: "qq2",
    quiz_id: "q1",
    question_text: "Viết số 5 bằng chữ",
    question_type: "short_answer",
    points: 10,
    display_order: 2,
    answers: [{ answer_text: "năm", is_correct: true, display_order: 1 }],
  },
];

beforeEach(() => {
  resetMockApi();
  mockApi.get.mockResolvedValue(envelope(QUESTIONS));
  mockApi.put.mockResolvedValue(envelope(QUESTIONS[0]));
});

describe("QuizQuestionsEditor", () => {
  it("liệt kê câu hỏi đã tạo với nội dung và đáp án đúng đang lưu", async () => {
    renderWithProviders(<QuizQuestionsEditor quizId="q1" />);
    expect(await screen.findByDisplayValue("1 + 1 = ?")).toBeTruthy();
    expect(mockApi.get).toHaveBeenCalledWith("/quizzes/q1/questions");
    expect((screen.getByLabelText("Chọn phương án B làm đáp án đúng của câu 1") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("button", { name: "Lưu câu 1" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("sửa nội dung + đổi đáp án đúng rồi lưu: PUT đúng body (thay toàn bộ đáp án)", async () => {
    renderWithProviders(<QuizQuestionsEditor quizId="q1" />);
    await screen.findByDisplayValue("1 + 1 = ?");

    fireEvent.change(screen.getByLabelText("Nội dung câu hỏi 1"), { target: { value: "2 + 2 = ?" } });
    fireEvent.change(screen.getByLabelText("Phương án A câu 1"), { target: { value: "4" } });
    fireEvent.click(screen.getByLabelText("Chọn phương án A làm đáp án đúng của câu 1"));
    fireEvent.click(screen.getByRole("button", { name: "Lưu câu 1" }));

    await waitFor(() => expect(mockApi.put).toHaveBeenCalledTimes(1));
    expect(mockApi.put).toHaveBeenCalledWith("/quizzes/q1/questions/qq1", {
      question_text: "2 + 2 = ?",
      explanation: "Cộng.",
      answers: [
        { answer_text: "4", is_correct: true, display_order: 1 },
        { answer_text: "2", is_correct: false, display_order: 2 },
        { answer_text: "3", is_correct: false, display_order: 3 },
      ],
    });
  });

  it("xoá chữ của một phương án còn lại < 2 hoặc bỏ hết đáp án đúng: báo lỗi và không cho lưu", async () => {
    renderWithProviders(<QuizQuestionsEditor quizId="q1" />);
    await screen.findByDisplayValue("1 + 1 = ?");

    fireEvent.change(screen.getByLabelText("Phương án B câu 1"), { target: { value: "" } });
    expect(screen.getByRole("alert").textContent).toContain("Điền đầy đủ các phương án");
    expect((screen.getByRole("button", { name: "Lưu câu 1" }) as HTMLButtonElement).disabled).toBe(true);
    expect(mockApi.put).not.toHaveBeenCalled();
  });

  it("câu tự luận ngắn: chỉ sửa nội dung/giải thích, không gửi answers", async () => {
    renderWithProviders(<QuizQuestionsEditor quizId="q1" />);
    await screen.findByDisplayValue("Viết số 5 bằng chữ");
    expect(screen.getByText(/chưa sửa được tại đây/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Nội dung câu hỏi 2"), { target: { value: "Viết số 6 bằng chữ" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu câu 2" }));

    await waitFor(() => expect(mockApi.put).toHaveBeenCalledTimes(1));
    expect(mockApi.put).toHaveBeenCalledWith("/quizzes/q1/questions/qq2", { question_text: "Viết số 6 bằng chữ", explanation: "" });
  });
});
