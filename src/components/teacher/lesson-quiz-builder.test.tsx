import { useState } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LessonQuizBuilder, type LessonQuizQuestion } from "./lesson-quiz-builder";
const ai = vi.hoisted(() => ({ generate: vi.fn(), cancel: vi.fn(), document: vi.fn() }));
vi.mock("@/services/open-design.service", () => ({ openDesignService: ai }));
const initial: LessonQuizQuestion = {
  id: "q1",
  question: "1 + 1 = ?",
  correctId: "b",
  explanation: "Cộng hai số một.",
  options: [
    { id: "a", text: "1" },
    { id: "b", text: "2" },
    { id: "c", text: "3" },
    { id: "d", text: "4" },
  ],
};
function Harness() {
  const [questions, setQuestions] = useState([initial]);
  return (
    <LessonQuizBuilder title="Toán" questions={questions} onChange={setQuestions} errors={{}} />
  );
}
beforeEach(() => {
  vi.clearAllMocks();
});
describe("Lesson quiz builder", () => {
  it("teacher changes the answer key and the preview grades against that key", async () => {
    render(<Harness />);
    fireEvent.click(
      screen.getByRole("button", { name: "Chọn phương án C làm đáp án đúng của câu 1" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Làm thử" }));
    fireEvent.click(screen.getByRole("radio", { name: /3/ }));
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài thử" }));
    expect(screen.getByRole("status").textContent).toContain("1/1");
  });
  it("double click creates one generation, preserves draft, and applying is explicit", async () => {
    let resolve: (v: unknown) => void = () => {};
    ai.generate.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Tạo bằng AI" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Yêu cầu tạo trắc nghiệm" }), {
      target: { value: "Tạo câu hỏi mới" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tạo câu hỏi" }), { detail: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Dừng tạo" }), { detail: 2 });
    expect(ai.generate).toHaveBeenCalledTimes(1);
    expect(ai.cancel).not.toHaveBeenCalled();
    await act(async () =>
      resolve({
        artifact: {
          kind: "quiz",
          title: "Mới",
          questions: [
            {
              question: "Câu AI",
              options: ["A", "B", "C", "D"],
              correct_answer: 2,
              explanation: "Giải thích AI",
            },
          ],
        },
      })
    );
    expect(
      (screen.getByRole("textbox", { name: "Nội dung câu hỏi 1" }) as HTMLTextAreaElement).value
    ).toBe("1 + 1 = ?");
    fireEvent.click(screen.getByRole("button", { name: "Thay toàn bộ câu hỏi" }));
    expect(
      (screen.getByRole("textbox", { name: "Nội dung câu hỏi 1" }) as HTMLTextAreaElement).value
    ).toBe("Câu AI");
    expect(
      screen
        .getByRole("button", { name: "Chọn phương án C làm đáp án đúng của câu 1" })
        .getAttribute("aria-pressed")
    ).toBe("true");
  });
  it("AI error preserves the current question and surfaces the error", async () => {
    ai.generate.mockRejectedValue(new Error("AI chưa cấu hình"));
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Tạo bằng AI" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Yêu cầu tạo trắc nghiệm" }), {
      target: { value: "Tạo câu hỏi mới" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tạo câu hỏi" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("AI chưa cấu hình")
    );
    expect(
      (screen.getByRole("textbox", { name: "Nội dung câu hỏi 1" }) as HTMLTextAreaElement).value
    ).toBe("1 + 1 = ?");
  });
});
