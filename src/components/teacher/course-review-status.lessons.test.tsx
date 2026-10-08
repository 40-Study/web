/**
 * QA 261008 T6 (UI): gửi duyệt khoá còn bài chưa có nội dung -> backend 422 COURSE_LESSON_NO_CONTENT kèm
 * `lessons:[{id,title}]`. Panel phải liệt kê tên từng bài ngay tại nút gửi duyệt (toast thì biến mất),
 * không còn câu chung chung.
 */

import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors";

let mockSubmitError: unknown = null;
vi.mock("@/hooks/queries/use-course-approval", () => ({
  useSubmitCourseReview: () => ({ mutate: vi.fn(), isPending: false, error: mockSubmitError }),
  useWithdrawCourseReview: () => ({ mutate: vi.fn(), isPending: false }),
}));

// eslint-disable-next-line import/first
import { CourseReviewPanel } from "./course-review-status";

const noContentError = () =>
  new ValidationError(
    {},
    {
      code: "COURSE_LESSON_NO_CONTENT",
      message: "Every lesson must have content before submitting for review. Lessons without content: Bài 2, Bài 3",
      payload: {
        lessons: [
          { id: "l2", title: "Bài 2" },
          { id: "l3", title: "Bài 3" },
        ],
      },
    }
  );

describe("CourseReviewPanel — bài học chưa có nội dung (T6)", () => {
  beforeEach(() => {
    mockSubmitError = null;
  });

  it("khoá nháp + lỗi COURSE_LESSON_NO_CONTENT -> hiện câu tiếng Việt và tên từng bài", () => {
    mockSubmitError = noContentError();
    render(<CourseReviewPanel courseId="c1" status="draft" lessonCount={3} />);

    const alert = screen.getByTestId("submit-review-no-content");
    expect(alert.textContent).toContain("Mọi bài học cần có nội dung trước khi gửi duyệt.");
    const items = within(alert).getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual(["Bài 2", "Bài 3"]);
    expect(alert.textContent).not.toMatch(/Every lesson/);
  });

  it("khoá bị từ chối gửi lại cũng hiện danh sách", () => {
    mockSubmitError = noContentError();
    render(<CourseReviewPanel courseId="c1" status="rejected" rejectionReason="x" lessonCount={3} />);
    expect(within(screen.getByTestId("submit-review-no-content")).getAllByRole("listitem")).toHaveLength(2);
  });

  it("không có lỗi, hoặc lỗi loại khác -> không có khung cảnh báo", () => {
    const { rerender } = render(<CourseReviewPanel courseId="c1" status="draft" lessonCount={3} />);
    expect(screen.queryByTestId("submit-review-no-content")).toBeNull();

    mockSubmitError = new Error("boom");
    rerender(<CourseReviewPanel courseId="c1" status="draft" lessonCount={3} />);
    expect(screen.queryByTestId("submit-review-no-content")).toBeNull();
  });
});
