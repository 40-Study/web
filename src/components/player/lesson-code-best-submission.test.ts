import { describe, expect, it } from "vitest";
import { hasPassingSubmission } from "./lesson-code-best-submission";
import type { LessonCodeHistoryItem } from "@/services/lesson-code.service";

const item = (score: number, total = 4): LessonCodeHistoryItem => ({
  id: String(score),
  language: "cpp",
  code: "",
  status: "X",
  passed: 0,
  total,
  score,
  created_at: "2026-11-04T00:00:00Z",
});

describe("hasPassingSubmission (QA3 Q15)", () => {
  it("lượt gần nhất trượt nhưng lịch sử có lượt Accepted 100 → vẫn đạt", () => {
    expect(hasPassingSubmission(item(25), [item(25), item(100)], 100)).toBe(true);
  });
  it("lượt gần nhất đạt → đạt, không cần lịch sử", () => {
    expect(hasPassingSubmission(item(100), undefined, 100)).toBe(true);
  });
  it("không lượt nào đạt → không đạt", () => {
    expect(hasPassingSubmission(item(75), [item(50)], 100)).toBe(false);
  });
  it("lượt không có test (total=0) không bao giờ tính là đạt", () => {
    expect(hasPassingSubmission(item(100, 0), [item(100, 0)], 100)).toBe(false);
  });
  it("chưa nộp lần nào → không đạt", () => {
    expect(hasPassingSubmission(undefined, [], 100)).toBe(false);
  });
});
