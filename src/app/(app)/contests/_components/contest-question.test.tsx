/**
 * Trang làm bài KHÔNG được hiện đáp án (contract §2.1: không DTO làm bài nào có is_correct/
 * correct_answer_ids/explanation). Test đưa vào một câu hỏi "lỡ" mang thêm các field đó và kiểm
 * chúng không lọt ra màn hình, không đánh dấu sẵn đáp án nào.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContestAttemptQuestion } from "@/types/contest";
import { ContestQuestion } from "./contest-question";

const leaked = {
  id: "q1",
  question_text: "Lệnh nào tạo commit?",
  question_type: "single_choice",
  points: 1,
  display_order: 1,
  answers: [
    { id: "a1", answer_text: "git commit", display_order: 1, is_correct: true },
    { id: "a2", answer_text: "git push", display_order: 2, is_correct: false },
  ],
  correct_answer_ids: ["a1"],
  explanation: "GIAI_THICH_BI_MAT",
  answer_key: "DAP_AN_BI_MAT",
} as unknown as ContestAttemptQuestion;

describe("ContestQuestion — không lộ đáp án", () => {
  it("không render explanation/answer_key/is_correct, không chọn sẵn đáp án", () => {
    const { container } = render(<ContestQuestion index={0} question={leaked} draft={undefined} onChange={() => {}} />);
    const html = container.innerHTML;
    expect(html).not.toContain("GIAI_THICH_BI_MAT");
    expect(html).not.toContain("DAP_AN_BI_MAT");
    expect(html).not.toMatch(/is_correct|correct_answer|Đáp án đúng/i);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios).toHaveLength(2);
    expect(radios.every((r) => !r.checked)).toBe(true);
  });

  it("chọn đáp án gọi onChange với id đáp án", () => {
    const onChange = vi.fn();
    render(<ContestQuestion index={0} question={leaked} draft={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("git push"));
    expect(onChange).toHaveBeenCalledWith({ selected: ["a2"], text: "" });
  });

  it("fill_blank -> ô nhập chữ, multiple_choice -> checkbox", () => {
    const fill = { ...leaked, id: "q2", question_type: "fill_blank", answers: [] } as ContestAttemptQuestion;
    const multi = { ...leaked, id: "q3", question_type: "multiple_choice" } as ContestAttemptQuestion;
    render(
      <>
        <ContestQuestion index={1} question={fill} draft={undefined} onChange={() => {}} />
        <ContestQuestion index={2} question={multi} draft={undefined} onChange={() => {}} />
      </>
    );
    expect(screen.getByPlaceholderText("Nhập câu trả lời…")).toBeTruthy();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });
});
