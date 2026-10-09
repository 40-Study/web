/**
 * Phase 2 (QA follow-up 261008) — hợp đồng web cho nội dung ARTICLE + QUIZ của bài học (contract C1).
 *
 * Gom ba thứ mà trang giáo viên và trang học dựa vào cùng lúc:
 *  1. Service gửi đúng hình dạng DTO của C1 (article_body / quiz_id, KHÔNG gửi type khi sửa).
 *  2. Từ danh sách content của một bài suy ra đúng loại hiển thị.
 *  3. Quiz vừa là content `quiz` vừa nằm trong `GET /lessons/:id/quizzes` chỉ hiện MỘT lần.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { lessonContentService } from "@/services/lesson-content.service";
import type { LessonContent } from "@/services/lesson-content.service";
import { quizzesForTab, resolveLessonKind } from "@/components/player/lesson-kind";

const post = vi.fn();
const put = vi.fn();
vi.mock("@/lib/api-client", () => ({
  api: {
    post: (...a: unknown[]) => post(...a),
    put: (...a: unknown[]) => put(...a),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

const envelope = (data: unknown) => ({ data: { message: "success", data } });

describe("lessonContentService — hình dạng request của contract C1", () => {
  beforeEach(() => {
    post.mockReset().mockResolvedValue(envelope({ id: "c1" }));
    put.mockReset().mockResolvedValue(envelope({ id: "c1" }));
  });

  it("tạo article gửi article_body nguyên văn (HTML Tiptap), không có khoá duration/quiz_id", async () => {
    await lessonContentService.createContent("les-1", {
      type: "article",
      title: "Bài đọc",
      article_body: "<p>html</p>",
      is_mandatory: true,
      display_order: 0,
    });
    expect(post).toHaveBeenCalledWith("/lessons/les-1/contents", {
      type: "article",
      title: "Bài đọc",
      article_body: "<p>html</p>",
      is_mandatory: true,
      display_order: 0,
    });
  });

  it("tạo quiz gửi quiz_id (không gửi quiz lồng nhau, không duration)", async () => {
    await lessonContentService.createContent("les-1", {
      type: "quiz",
      title: "Kiểm tra",
      quiz_id: "11111111-1111-1111-1111-111111111111",
      is_mandatory: true,
    });
    const [, body] = post.mock.calls[0];
    expect(body).toEqual({
      type: "quiz",
      title: "Kiểm tra",
      quiz_id: "11111111-1111-1111-1111-111111111111",
      is_mandatory: true,
    });
    expect(body).not.toHaveProperty("duration");
  });

  it("sửa bài viết: PUT chỉ mang title + article_body, KHÔNG có type (backend 400 CONTENT_TYPE_IMMUTABLE)", async () => {
    await lessonContentService.updateContent("les-1", "c1", { title: "Mới", article_body: "<p>v2</p>" });
    expect(put).toHaveBeenCalledWith("/lessons/les-1/contents/c1", { title: "Mới", article_body: "<p>v2</p>" });
    expect(put.mock.calls[0][1]).not.toHaveProperty("type");
  });
});

const content = (over: Partial<LessonContent>): LessonContent => ({
  id: "c",
  lesson_id: "les-1",
  type: "video",
  title: "t",
  display_order: 0,
  ...over,
});

describe("bài có nội dung article/quiz — loại hiển thị và tab Quiz", () => {
  it("bài chỉ có một bài viết -> article (trước đây rơi vào nhánh video 'Video không khả dụng')", () => {
    expect(resolveLessonKind([content({ type: "article", article_body: "<p>x</p>", reading_time_minutes: 1 })])).toBe(
      "article"
    );
  });

  it("quiz đứng đầu bài -> kind quiz và quiz đó KHÔNG lặp lại trong tab Quiz (plan D2)", () => {
    const contents = [content({ type: "quiz", quiz_id: "q1" })];
    expect(resolveLessonKind(contents)).toBe("quiz");
    expect(quizzesForTab([{ id: "q1" }, { id: "q2" }], contents).map((q) => q.id)).toEqual(["q2"]);
  });

  it("quiz đã backfill thành content nhưng bài có video: quiz KHÔNG được hiện làm nội dung nên phải còn trong tab", () => {
    const contents = [content({ type: "video" }), content({ id: "c2", type: "quiz", quiz_id: "q1", display_order: 1 })];
    expect(resolveLessonKind(contents)).toBe("video");
    expect(quizzesForTab([{ id: "q1" }], contents).map((q) => q.id)).toEqual(["q1"]);
  });
});
