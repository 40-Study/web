import { describe, expect, it } from "vitest";
import { getWeekStreakFlags } from "./streak-card";
import { getCurrentLessonNumber } from "./continue-learning-card";

describe("getWeekStreakFlags", () => {
  it("đánh dấu hôm nay và các ngày trước trong chuỗi khi đã học hôm nay", () => {
    // Hôm nay = T4 (index 2), chuỗi 2 ngày → T3, T4
    expect(getWeekStreakFlags(2, true, 2)).toEqual([false, true, true, false, false, false, false]);
  });

  it("đếm từ hôm qua khi chưa học hôm nay", () => {
    // Hôm nay = T5 (index 3), chuỗi 2 ngày, chưa học hôm nay → T3, T4
    expect(getWeekStreakFlags(2, false, 3)).toEqual([false, true, true, false, false, false, false]);
  });

  it("không tràn sang tuần trước", () => {
    expect(getWeekStreakFlags(10, true, 1)).toEqual([true, true, false, false, false, false, false]);
  });

  it("chuỗi 0 thì không ô nào sáng", () => {
    expect(getWeekStreakFlags(0, false, 4).some(Boolean)).toBe(false);
  });
});

describe("getCurrentLessonNumber", () => {
  it("là bài kế tiếp sau số bài đã xong", () => {
    expect(getCurrentLessonNumber(4, 24)).toBe(5);
  });

  it("không vượt tổng số bài", () => {
    expect(getCurrentLessonNumber(24, 24)).toBe(24);
  });

  it("bằng 0 khi khoá chưa có bài", () => {
    expect(getCurrentLessonNumber(0, 0)).toBe(0);
  });
});
