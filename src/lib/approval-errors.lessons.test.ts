import { describe, expect, it } from "vitest";
import { ApiError, ValidationError } from "@/lib/errors";
import { approvalErrorMessage, lessonsWithoutContent } from "./approval-errors";

function noContentError(lessons: unknown) {
  return new ValidationError(
    {},
    {
      code: "COURSE_LESSON_NO_CONTENT",
      message: "Every lesson must have content before submitting for review. Lessons without content: A",
      payload: { lessons },
    }
  );
}

describe("COURSE_LESSON_NO_CONTENT (T6)", () => {
  it("dịch sang tiếng Việt, không in message tiếng Anh của backend", () => {
    expect(approvalErrorMessage(noContentError([]), "fallback")).toBe(
      "Mọi bài học cần có nội dung trước khi gửi duyệt."
    );
  });

  it("lessonsWithoutContent trả danh sách {id,title} từ body, bỏ phần tử hỏng", () => {
    const list = lessonsWithoutContent(
      noContentError([{ id: "l1", title: "Bài 1" }, { id: "l2" }, null, { title: "  " }, { title: "Bài 3" }])
    );
    expect(list).toEqual([
      { id: "l1", title: "Bài 1" },
      { id: "Bài 3", title: "Bài 3" },
    ]);
  });

  it("lỗi khác code -> null; đúng code nhưng thiếu body -> mảng rỗng (vẫn nhận ra loại lỗi)", () => {
    expect(lessonsWithoutContent(new ApiError(400, "COURSE_EMPTY", "x"))).toBeNull();
    expect(lessonsWithoutContent(new Error("boom"))).toBeNull();
    expect(lessonsWithoutContent(new ApiError(422, "COURSE_LESSON_NO_CONTENT", "x"))).toEqual([]);
  });
});
