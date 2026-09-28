/**
 * QuizBuilder — M2: tạo được câu điền khuyết qua UI; m8: lưu câu lỗi giữa chừng rồi bấm lưu lại thì
 * TÁI DÙNG quiz đã tạo (không tạo quiz trùng) và chỉ thêm câu còn thiếu; huỷ khi có quiz dở thì xoá.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreate = vi.fn();
const mockCreateQuestion = vi.fn();
const mockDelete = vi.fn();
vi.mock("@/services/quiz.service", () => ({
  quizService: {
    create: (...a: unknown[]) => mockCreate(...a),
    createQuestion: (...a: unknown[]) => mockCreateQuestion(...a),
    delete: (...a: unknown[]) => mockDelete(...a),
  },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

// eslint-disable-next-line import/first
import { QuizBuilder } from "./quiz-builder";

function fillBasics() {
  fireEvent.change(screen.getByLabelText(/Tên bài trắc nghiệm/), { target: { value: "QA-contest quiz" } });
  fireEvent.change(screen.getByLabelText("Nội dung câu 1"), { target: { value: "2 + 2 = ?" } });
  fireEvent.change(screen.getByLabelText("Câu 1 đáp án 1"), { target: { value: "4" } });
  fireEvent.change(screen.getByLabelText("Câu 1 đáp án 2"), { target: { value: "5" } });
}

function addFillBlankQuestion() {
  fireEvent.click(screen.getByRole("button", { name: /Thêm câu hỏi/ }));
  fireEvent.change(screen.getByLabelText("Loại câu 2"), { target: { value: "fill_blank" } });
  fireEvent.change(screen.getByLabelText("Nội dung câu 2"), { target: { value: "Thủ đô Việt Nam là ___" } });
  fireEvent.change(screen.getByLabelText("Câu 2 đáp án chấp nhận 1"), { target: { value: "Hà Nội" } });
}

describe("QuizBuilder", () => {
  beforeEach(() => {
    mockCreate.mockReset().mockResolvedValue({ id: "quiz-1" });
    mockCreateQuestion.mockReset().mockResolvedValue({});
    mockDelete.mockReset().mockResolvedValue({});
  });

  it("M2: tạo câu điền khuyết (không có radio đúng/sai), gửi fill_blank + is_correct=true", async () => {
    const onCreated = vi.fn();
    render(<QuizBuilder onCreated={onCreated} onCancel={vi.fn()} />);
    fillBasics();
    addFillBlankQuestion();
    expect(screen.queryByLabelText(/Câu 2 đáp án 1 đúng/)).toBeNull();
    // Quy tắc chấm fill_blank chốt 29/09: không phân biệt hoa thường, giữ nguyên dấu.
    const hint = screen.getByTestId("fill-blank-hint-1").textContent ?? "";
    expect(hint).toMatch(/không phân biệt chữ hoa, chữ thường/);
    expect(hint).toMatch(/GIỮ NGUYÊN dấu/);
    fireEvent.click(screen.getByRole("button", { name: /Thêm cách viết khác/ }));
    fireEvent.change(screen.getByLabelText("Câu 2 đáp án chấp nhận 2"), { target: { value: "Ha Noi" } });

    fireEvent.click(screen.getByTestId("quiz-builder-save"));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith("quiz-1"));
    expect(mockCreateQuestion).toHaveBeenLastCalledWith("quiz-1", expect.objectContaining({
      question_type: "fill_blank",
      answers: [
        { answer_text: "Hà Nội", is_correct: true, display_order: 1 },
        { answer_text: "Ha Noi", is_correct: true, display_order: 2 },
      ],
    }));
  });

  it("m8: câu 2 lỗi → lưu lại dùng CÙNG quiz, chỉ gửi câu còn thiếu, không tạo quiz trùng", async () => {
    const onCreated = vi.fn();
    mockCreateQuestion
      .mockResolvedValueOnce({}) // câu 1
      .mockRejectedValueOnce(new Error("mạng lỗi")) // câu 2 lần đầu
      .mockResolvedValueOnce({}); // câu 2 lần sau
    render(<QuizBuilder onCreated={onCreated} onCancel={vi.fn()} />);
    fillBasics();
    addFillBlankQuestion();

    fireEvent.click(screen.getByTestId("quiz-builder-save"));
    await screen.findByText(/Lưu câu 2 thất bại/);
    expect(onCreated).not.toHaveBeenCalled();
    // Câu đã lưu bị khoá để nội dung trên màn hình khớp backend.
    expect((screen.getByLabelText("Nội dung câu 1") as HTMLTextAreaElement).disabled).toBe(true);

    fireEvent.click(screen.getByTestId("quiz-builder-save"));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith("quiz-1"));
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreateQuestion).toHaveBeenCalledTimes(3);
    expect(mockCreateQuestion.mock.calls[2][1]).toMatchObject({ display_order: 2, question_type: "fill_blank" });
  });

  it("m8: huỷ khi còn quiz dở → xoá quiz đó", async () => {
    const onCancel = vi.fn();
    mockCreateQuestion.mockRejectedValueOnce(new Error("mạng lỗi"));
    render(<QuizBuilder onCreated={vi.fn()} onCancel={onCancel} />);
    fillBasics();
    fireEvent.click(screen.getByTestId("quiz-builder-save"));
    await screen.findByText(/Lưu câu 1 thất bại/);
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }));
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
    expect(mockDelete).toHaveBeenCalledWith("quiz-1");
  });
});
