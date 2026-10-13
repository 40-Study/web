import { describe, expect, it } from "vitest";
import { formatLessonProgress } from "./lesson-progress-label";

describe("formatLessonProgress", () => {
  it("số bài ĐÃ HỌC trên tổng, không phải số thứ tự bài đang học", () => {
    expect(formatLessonProgress(5, 9)).toBe("5/9 bài học");
  });

  it("chưa học bài nào / khoá chưa có bài", () => {
    expect(formatLessonProgress(0, 9)).toBe("0/9 bài học");
    expect(formatLessonProgress(0, 0)).toBe("0/0 bài học");
  });

  it("không vượt tổng số bài khi dữ liệu lệch", () => {
    expect(formatLessonProgress(12, 9)).toBe("9/9 bài học");
  });
});
