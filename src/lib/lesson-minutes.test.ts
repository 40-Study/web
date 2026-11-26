import { describe, expect, it } from "vitest";
import { LESSON_MINUTES_ERROR, LESSON_MINUTES_MAX, parseLessonMinutes } from "./lesson-minutes";

describe("parseLessonMinutes (Q7-T01)", () => {
  it("ô trống hoặc chỉ khoảng trắng là empty, không phải 0", () => {
    expect(parseLessonMinutes("")).toEqual({ kind: "empty" });
    expect(parseLessonMinutes("   ")).toEqual({ kind: "empty" });
  });

  it("nhận số nguyên 0..1440", () => {
    expect(parseLessonMinutes("0")).toEqual({ kind: "valid", minutes: 0 });
    expect(parseLessonMinutes("45")).toEqual({ kind: "valid", minutes: 45 });
    expect(parseLessonMinutes(String(LESSON_MINUTES_MAX))).toEqual({ kind: "valid", minutes: LESSON_MINUTES_MAX });
  });

  it.each(["-5", "2.5", "1e3", "+4", "abc", "99999999999", String(LESSON_MINUTES_MAX + 1)])(
    "từ chối %s kèm thông báo tiếng Việt",
    (input) => {
      expect(parseLessonMinutes(input)).toEqual({ kind: "invalid", message: LESSON_MINUTES_ERROR });
    }
  );
});
