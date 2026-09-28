/**
 * Kiểm sống 28/09: câu điền khuyết đã điền và được điểm lại hiện "Bạn bỏ trống câu này" vì màn
 * xem lại chỉ đọc selected_answer_ids. Test khoá lại: text_answer phải được coi là câu trả lời.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ContestReviewAnswer } from "@/types/contest";
import { ContestAnswerReview, contestAnswerGiven } from "./contest-answer-review";

const fill: ContestReviewAnswer = {
  id: "r1", question_id: "q1", question_text: "git ____", selected_answer_ids: [], text_answer: "init",
  is_correct: true, points_earned: 1, correct_answer_ids: ["a-init"], explanation: "git init tạo .git",
};
const choice: ContestReviewAnswer = {
  id: "r2", question_id: "q2", question_text: "Lệnh commit?", selected_answer_ids: ["a1"], is_correct: true,
  points_earned: 2, correct_answer_ids: ["a1"],
};
const skipped: ContestReviewAnswer = { id: "r3", question_id: "q3", question_text: "Bỏ", selected_answer_ids: null, points_earned: 0 };

describe("ContestAnswerReview", () => {
  it("fill_blank đã điền -> hiện câu trả lời, KHÔNG ghi bỏ trống", () => {
    render(<ContestAnswerReview answers={[fill]} />);
    expect(screen.getByText("init")).toBeTruthy();
    expect(screen.queryByText(/bỏ trống/)).toBeNull();
    expect(screen.getByText("git init tạo .git")).toBeTruthy();
  });

  it("chọn đáp án -> hiện chữ đáp án từ bảng id → chữ", () => {
    expect(contestAnswerGiven(choice, new Map([["a1", "git commit"]]))).toBe("git commit");
  });

  it("không có gì -> bỏ trống", () => {
    render(<ContestAnswerReview answers={[skipped]} />);
    expect(screen.getByText(/Bạn bỏ trống câu này/)).toBeTruthy();
  });
});
