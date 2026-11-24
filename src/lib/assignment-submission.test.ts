import { describe, expect, it } from "vitest";
import { hasSubmitted, submissionLabel } from "./assignment-submission";

describe("submissionLabel", () => {
  it("chưa nộp (vắng, null) -> null", () => {
    expect(submissionLabel(undefined)).toBeNull();
    expect(submissionLabel(null)).toBeNull();
    expect(hasSubmitted({})).toBe(false);
    expect(hasSubmitted({ my_submission: null })).toBe(false);
  });

  it("đã nộp, chưa có điểm -> 'Đã nộp'", () => {
    expect(submissionLabel({ id: "1", status: "submitted", score: null })).toBe("Đã nộp");
  });

  it("đã chấm -> 'Đã chấm 9/10', điểm lẻ theo dấu phẩy vi-VN", () => {
    expect(submissionLabel({ id: "1", status: "graded", score: 9, max_score: 10 })).toBe("Đã chấm 9/10");
    expect(submissionLabel({ id: "1", status: "graded", score: 7.5, max_score: 10 })).toBe("Đã chấm 7,5/10");
    expect(submissionLabel({ id: "1", status: "graded", score: 0, max_score: 10 })).toBe("Đã chấm 0/10");
  });

  it("có điểm nhưng không có max_score -> chỉ điểm", () => {
    expect(submissionLabel({ id: "1", status: "graded", score: 8 })).toBe("Đã chấm 8");
  });
});
