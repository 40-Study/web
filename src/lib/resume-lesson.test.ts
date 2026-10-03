import { describe, expect, it } from "vitest";
import { pickResumeLessonId } from "./resume-lesson";

const done = { status: "completed" };

describe("pickResumeLessonId — A-11: Tiếp tục học mở bài chưa học, không phải bài 1", () => {
  it("bỏ qua các bài đã hoàn thành, mở bài chưa xong đầu tiên (kể cả sang chương sau)", () => {
    const sections = [
      { lessons: [{ id: "l1", progress: done }, { id: "l2", progress: done }] },
      { lessons: [{ id: "l3", progress: done }, { id: "l4", progress: { status: "in_progress" } }, { id: "l5" }] },
    ];
    expect(pickResumeLessonId(sections)).toBe("l4");
  });

  it("không chọn bài đang bị khoá", () => {
    const sections = [
      { lessons: [{ id: "l1", progress: done }, { id: "l2", locked: true }, { id: "l3", locked: true }] },
    ];
    // Không còn bài mở khoá nào chưa xong -> quay về bài đầu để ôn thay vì dẫn vào bài khoá.
    expect(pickResumeLessonId(sections)).toBe("l1");
  });

  it("chưa học gì thì mở bài đầu", () => {
    expect(pickResumeLessonId([{ lessons: [{ id: "l1" }, { id: "l2" }] }])).toBe("l1");
  });

  it("học xong hết thì mở lại bài đầu", () => {
    expect(pickResumeLessonId([{ lessons: [{ id: "l1", progress: done }, { id: "l2", progress: done }] }])).toBe("l1");
  });

  it("khoá chưa có bài nào trả undefined", () => {
    expect(pickResumeLessonId([{ lessons: [] }])).toBeUndefined();
  });
});
