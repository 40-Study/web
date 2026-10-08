/**
 * QA 261008 T8/T9 — trang chi tiết bài học của giáo viên:
 *  - T8: "Vị trí:" để trống vì đọc `lesson.position` (API chỉ trả `display_order`).
 *  - T9: huy hiệu loại luôn là "ARTICLE" vì đọc `lesson.type` (không còn; loại nằm trên LessonContent).
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "course-1", lessonId: "les-1" }),
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

vi.mock("@/hooks/queries/use-sections", () => ({
  useSections: () => ({ data: [{ id: "sec-1", title: "Chương 1", order: 1 }], isLoading: false }),
}));

// Đúng hình dạng API: có display_order, KHÔNG có position/type.
vi.mock("@/hooks/queries/use-lessons", () => ({
  useLessons: (_courseId: string, sectionId: string) => ({
    data: sectionId
      ? [{ id: "les-1", section_id: "sec-1", title: "Bài 1", display_order: 3, is_preview: false }]
      : undefined,
    isLoading: false,
  }),
  useUpdateLesson: () => ({ mutate: vi.fn() }),
}));

let mockContents: { id: string; type: string }[] = [];
vi.mock("@/hooks/queries/use-lesson-content", () => ({
  useLessonContents: () => ({ data: mockContents, isLoading: false }),
}));

vi.mock("@/components/teacher/subtitle-upload-field", () => ({ SubtitleUploadField: () => null }));

// eslint-disable-next-line import/first
import TeacherLessonDetailPage from "./page";

describe("/teacher/courses/[id]/lessons/[lessonId] (T8/T9)", () => {
  beforeEach(() => {
    mockContents = [];
  });

  it("T8: 'Vị trí:' hiện display_order của bài (không để trống)", () => {
    render(<TeacherLessonDetailPage />);
    const row = screen.getByText("Vị trí:").parentElement as HTMLElement;
    expect(row.textContent).toBe("Vị trí: 3");
  });

  it("T9: bài chưa có nội dung -> không bịa huy hiệu 'ARTICLE'", () => {
    render(<TeacherLessonDetailPage />);
    expect(screen.queryByText("ARTICLE")).toBeNull();
  });

  it("T9: huy hiệu lấy từ loại nội dung thật của bài, mỗi loại một lần", () => {
    mockContents = [
      { id: "c1", type: "video" },
      { id: "c2", type: "video" },
      { id: "c3", type: "exercise" },
    ];
    render(<TeacherLessonDetailPage />);
    expect(screen.getAllByText("VIDEO")).toHaveLength(1);
    expect(screen.getByText("BÀI TẬP")).toBeTruthy();
    expect(screen.queryByText("ARTICLE")).toBeNull();
  });
});
