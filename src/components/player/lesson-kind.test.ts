/**
 * A2 (QA vòng 2, N6): loại bài lấy từ lesson_contents, không phải `lesson.type`
 * (curriculum không trả field này nên bài tập từng bị coi là video).
 */
import { describe, expect, it } from "vitest";
import {
  pickPrimaryContent,
  quizIdsShownAsContent,
  quizzesForTab,
  resolveLessonKind,
  toPlayerLessonType,
} from "./lesson-kind";

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

describe("resolveLessonKind — article / quiz (QA 261008 T1/T2/T7)", () => {
  it("bài chỉ có content article -> article", () => {
    expect(resolveLessonKind([{ type: "article", display_order: 0 }])).toBe("article");
  });

  it("bài chỉ có content quiz -> quiz", () => {
    expect(resolveLessonKind([{ type: "quiz", display_order: 0 }])).toBe("quiz");
  });

  it("có video thì video vẫn thắng article/quiz đứng trước", () => {
    expect(
      resolveLessonKind([
        { type: "article", display_order: 0 },
        { type: "quiz", display_order: 1 },
        { type: "video", display_order: 2 },
      ])
    ).toBe("video");
  });

  it("không video: content có display_order nhỏ nhất quyết định (article trước quiz)", () => {
    expect(
      resolveLessonKind([
        { type: "quiz", display_order: 1 },
        { type: "article", display_order: 0 },
      ])
    ).toBe("article");
  });

  it("pickPrimaryContent trả đúng hàng được dùng để hiển thị", () => {
    const article = { id: "a", type: "article" as const, display_order: 0 };
    const quiz = { id: "q", type: "quiz" as const, display_order: 1 };
    expect(pickPrimaryContent([quiz, article])).toBe(article);
    expect(pickPrimaryContent([])).toBeUndefined();
    expect(pickPrimaryContent(undefined)).toBeUndefined();
  });
});

describe("tab Quiz bỏ quiz đã hiện làm nội dung (plan D2)", () => {
  const quizzes = [{ id: "q1" }, { id: "q2" }];

  it("quiz là nội dung chính của bài -> không liệt kê lần thứ hai trong tab", () => {
    const contents = [{ type: "quiz" as const, display_order: 0, quiz_id: "q1" }];
    expect(quizIdsShownAsContent(contents)).toEqual(new Set(["q1"]));
    expect(quizzesForTab(quizzes, contents)).toEqual([{ id: "q2" }]);
  });

  it("hàng quiz KHÔNG được hiển thị (bài có video) -> quiz vẫn nằm trong tab, không biến mất", () => {
    const contents = [
      { type: "video" as const, display_order: 0 },
      { type: "quiz" as const, display_order: 1, quiz_id: "q1" },
    ];
    expect(quizIdsShownAsContent(contents).size).toBe(0);
    expect(quizzesForTab(quizzes, contents)).toEqual(quizzes);
  });

  it("chưa tải content / chưa có quiz -> không lỗi", () => {
    expect(quizzesForTab(quizzes, undefined)).toEqual(quizzes);
    expect(quizzesForTab(undefined, [])).toEqual([]);
  });
});

describe("toPlayerLessonType", () => {
  it("map loại nội dung sang loại bài của player (article -> reading, livestream -> video)", () => {
    expect(toPlayerLessonType("article")).toBe("reading");
    expect(toPlayerLessonType("quiz")).toBe("quiz");
    expect(toPlayerLessonType("exercise")).toBe("exercise");
    expect(toPlayerLessonType("video")).toBe("video");
    expect(toPlayerLessonType("livestream")).toBe("video");
  });
});
