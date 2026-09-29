/**
 * Xem lại bài thi. Fixture đúng shape ĐÍNH CHÍNH 3 của contract (29/09): chữ đáp án nằm trong
 * `options` / `accepted_answers`, KHÔNG có localStorage nào được đọc (review M1).
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { ContestReviewAnswer } from "@/types/contest";
import { ContestAnswerReview, contestAnswerGiven, contestCorrectAnswer } from "./contest-answer-review";

// Ví dụ lấy nguyên từ ĐÍNH CHÍNH 3.
const singleWrong: ContestReviewAnswer = {
  id: "5950dfcc-82c3-44e2-b2ed-0be92e281ca5",
  question_id: "a1cee833-00ba-4dec-9b6d-44704b90ae1c",
  question_text: "Git lưu snapshot hay diff?",
  question_type: "single_choice",
  options: [
    { id: "373c2de1-6d2c-44de-83cf-d062bba0388f", answer_text: "Snapshot", display_order: 1 },
    { id: "47533026-faa9-4d6e-8777-7d745284061b", answer_text: "Diff", display_order: 2 },
  ],
  accepted_answers: [],
  selected_answer_ids: ["47533026-faa9-4d6e-8777-7d745284061b"],
  is_correct: false,
  points_earned: 0,
  correct_answer_ids: ["373c2de1-6d2c-44de-83cf-d062bba0388f"],
  explanation: "Git lưu snapshot của cây thư mục.",
};
const fillRight: ContestReviewAnswer = {
  id: "e2d31227-dbe5-459b-9e88-2f24be091bfd",
  question_id: "bac944de-d12b-4ef1-ba8f-703748e86934",
  question_text: "Thủ đô Việt Nam?",
  question_type: "fill_blank",
  options: [],
  accepted_answers: ["Hà Nội"],
  selected_answer_ids: [],
  text_answer: "Hà Nội",
  is_correct: true,
  points_earned: 1,
  correct_answer_ids: ["2eeb8fa6-3420-43e5-a77e-03866bf41d4e"],
};
const multiSkipped: ContestReviewAnswer = {
  id: "r3",
  question_id: "q3",
  question_text: "Lệnh nào làm việc với nhánh?",
  question_type: "multiple_choice",
  options: [
    { id: "b1", answer_text: "git branch", display_order: 1 },
    { id: "b2", answer_text: "git switch", display_order: 2 },
    { id: "b3", answer_text: "git log", display_order: 3 },
  ],
  accepted_answers: [],
  selected_answer_ids: null,
  points_earned: 0,
  correct_answer_ids: ["b1", "b2"],
};

beforeEach(() => window.localStorage.clear());

describe("ContestAnswerReview — chữ đáp án lấy từ response (ĐÍNH CHÍNH 3)", () => {
  it("câu chọn: 'Bạn trả lời' và 'Đáp án đúng' hiện chữ, không hiện id", () => {
    const { container } = render(<ContestAnswerReview answers={[singleWrong]} />);
    expect(screen.getByText("Diff")).toBeTruthy();
    expect(screen.getByText("Snapshot")).toBeTruthy();
    expect(container.textContent).not.toMatch(/373c2de1|47533026|Đáp án [0-9a-f]{8}/);
    expect(screen.getByText("Git lưu snapshot của cây thư mục.")).toBeTruthy();
  });

  it("điền khuyết: đáp án đúng lấy từ accepted_answers, câu trả lời từ text_answer", () => {
    const { container } = render(<ContestAnswerReview answers={[fillRight]} />);
    expect(contestCorrectAnswer(fillRight)).toBe("Hà Nội");
    expect(contestAnswerGiven(fillRight)).toBe("Hà Nội");
    expect(container.textContent).not.toContain("bỏ trống");
    expect(container.textContent).not.toContain("2eeb8fa6");
  });

  it("điền khuyết nhiều cách viết được chấp nhận -> nối bằng ' / '", () => {
    expect(contestCorrectAnswer({ ...fillRight, accepted_answers: ["Hà Nội", "Ha Noi"] })).toBe("Hà Nội / Ha Noi");
  });

  it("nhiều lựa chọn bỏ trống: ghi bỏ trống, đáp án đúng liệt kê đủ chữ", () => {
    render(<ContestAnswerReview answers={[multiSkipped]} />);
    expect(screen.getByText(/Bạn bỏ trống câu này/)).toBeTruthy();
    expect(screen.getByText("git branch, git switch")).toBeTruthy();
  });

  it("id lựa chọn không có trong options -> nói rõ, không in id", () => {
    const broken = { ...singleWrong, selected_answer_ids: ["khong-ton-tai"] };
    expect(contestAnswerGiven(broken)).toBe("(lựa chọn không còn tồn tại)");
  });

  it("không đọc localStorage: xem trên máy khác vẫn đủ chữ", () => {
    window.localStorage.setItem("contest-answer-text:x", JSON.stringify({ "373c2de1-6d2c-44de-83cf-d062bba0388f": "SAI_TỪ_STORAGE" }));
    const { container } = render(<ContestAnswerReview answers={[singleWrong]} />);
    expect(container.textContent).not.toContain("SAI_TỪ_STORAGE");
  });
});
