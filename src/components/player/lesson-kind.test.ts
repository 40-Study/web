/**
 * A2 (QA vòng 2, N6): loại bài lấy từ lesson_contents, không phải `lesson.type`
 * (curriculum không trả field này nên bài tập từng bị coi là video).
 */
import { describe, expect, it } from "vitest";
import { resolveLessonKind } from "./lesson-kind";

describe("resolveLessonKind", () => {
  it("bài chỉ có content exercise -> exercise (trước đây rơi vào nhánh video)", () => {
    expect(resolveLessonKind([{ type: "exercise", display_order: 1 }])).toBe("exercise");
  });

  it("bài chỉ có content livestream -> livestream", () => {
    expect(resolveLessonKind([{ type: "livestream", display_order: 1 }])).toBe("livestream");
  });

  it("có content video (dù không đứng đầu) -> video", () => {
    expect(
      resolveLessonKind([
        { type: "exercise", display_order: 1 },
        { type: "video", display_order: 2 },
      ])
    ).toBe("video");
  });

  it("không có video: lấy content có display_order nhỏ nhất", () => {
    expect(
      resolveLessonKind([
        { type: "exercise", display_order: 2 },
        { type: "livestream", display_order: 1 },
      ])
    ).toBe("livestream");
  });

  it("chưa tải content -> video (giữ khung loading video)", () => {
    expect(resolveLessonKind(undefined)).toBe("video");
    expect(resolveLessonKind([])).toBe("video");
  });
});
