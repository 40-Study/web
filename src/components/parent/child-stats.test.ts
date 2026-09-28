import { describe, expect, it } from "vitest";
import { inProgressCourseCount } from "./child-stats";

describe("inProgressCourseCount (E3)", () => {
  it("Đang học = tổng khoá - khoá đã hoàn thành", () => {
    expect(inProgressCourseCount({ enrolled_courses: 3, completed_courses: 1 })).toBe(2);
  });

  it("không âm khi dữ liệu lệch", () => {
    expect(inProgressCourseCount({ enrolled_courses: 1, completed_courses: 2 })).toBe(0);
  });
});
