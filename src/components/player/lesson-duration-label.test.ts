/** QA-A-17: mục lục ghi "18:00" (phút nhập tay) trong khi video thật chỉ 0:05. */
import { describe, expect, it } from "vitest";
import { formatLessonClock, lessonDurationLabel } from "./lesson-duration-label";

describe("lessonDurationLabel", () => {
  it("có số giây thật thì dùng số thật, bỏ qua phút nhập tay", () => {
    expect(lessonDurationLabel(18, 5)).toBe("0:05");
  });

  it("chưa có số thật: ước lượng từ phút như cũ", () => {
    expect(lessonDurationLabel(18, undefined)).toBe("18:00");
    expect(lessonDurationLabel(18, 0)).toBe("18:00");
    expect(lessonDurationLabel(18, Number.NaN)).toBe("18:00");
  });

  it("không có gì: 0:00", () => {
    expect(lessonDurationLabel(null)).toBe("0:00");
  });
});

describe("formatLessonClock", () => {
  it("định dạng như đồng hồ trình phát", () => {
    expect(formatLessonClock(5)).toBe("0:05");
    expect(formatLessonClock(65.4)).toBe("1:05");
    expect(formatLessonClock(3723)).toBe("1:02:03");
  });
});
