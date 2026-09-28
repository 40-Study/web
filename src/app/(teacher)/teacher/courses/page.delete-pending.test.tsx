/**
 * Re-review PR #79 (Q5): khoá đang chờ duyệt không xoá được (backend 409) — thẻ khoá ở tab
 * "Chờ duyệt" không được hiện nút xoá. Khoá nháp vẫn có nút xoá (đối chứng).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { COURSE_STATUS_LABEL } from "@/types/approval";

vi.mock("@/hooks/queries/use-courses", () => ({
  useMyCourses: () => ({
    data: [
      { id: "c-pending", title: "QA-Khoa cho duyet", status: "pending_review", total_students: 0 },
      { id: "c-draft", title: "QA-Khoa nhap", status: "draft", total_students: 0 },
    ],
    isLoading: false,
  }),
  useDeleteCourse: () => ({ mutate: vi.fn() }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// eslint-disable-next-line import/first
import TeacherCoursesPage from "./page";

function openTab(status: "pending_review" | "draft") {
  fireEvent.click(screen.getByText(new RegExp(`^${COURSE_STATUS_LABEL[status]} \\(1\\)`)));
}

describe("/teacher/courses — nút xoá theo trạng thái", () => {
  it("khoá chờ duyệt: không có nút xoá", () => {
    render(<TeacherCoursesPage />);
    openTab("pending_review");
    expect(screen.getByText("QA-Khoa cho duyet")).toBeTruthy();
    expect(screen.queryByTitle("Xóa khóa học")).toBeNull();
  });

  it("khoá nháp: vẫn có nút xoá", () => {
    render(<TeacherCoursesPage />);
    openTab("draft");
    expect(screen.getByText("QA-Khoa nhap")).toBeTruthy();
    expect(screen.getByTitle("Xóa khóa học")).toBeTruthy();
  });
});
