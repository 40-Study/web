/**
 * A9 (QA 261008): khoá "Chờ duyệt" thiếu `submitted_at` (seed/cũ) trước đây hiện "—" ở cột
 * "Ngày nộp". Nay rơi về `created_at` để hàng đợi luôn có mốc thời gian.
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminCourseItem } from "@/types/approval";

const mockUseAdminCourses = vi.fn();

vi.mock("@/hooks/queries/use-course-approval", () => ({
  useAdminCourses: (...args: unknown[]) => mockUseAdminCourses(...args),
  useApproveCourse: () => ({ mutate: vi.fn(), isPending: false }),
  useRejectCourse: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/components/admin/course-review-detail-dialog", () => ({
  CourseReviewDetailDialog: () => null,
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { permissions: string[]; sessionStatus: string }) => unknown) =>
    selector({ permissions: ["COURSES_APPROVE_ALL"], sessionStatus: "authenticated" }),
}));

// eslint-disable-next-line import/first
import AdminCoursesPage from "./page";

function buildCourse(overrides: Partial<AdminCourseItem> = {}): AdminCourseItem {
  return {
    id: "course-1",
    title: "Toán 12 nâng cao",
    status: "pending_review",
    instructor_name: "Nguyễn Văn A",
    instructor_email: "teacher1@fortex.vn",
    ...overrides,
  };
}

function withCourses(courses: AdminCourseItem[]) {
  mockUseAdminCourses.mockReturnValue({
    data: { courses, total: courses.length, page: 1, page_size: 20 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
}

describe("/admin/courses — A9: ngày nộp", () => {
  beforeEach(() => mockUseAdminCourses.mockReset());

  it("thiếu submitted_at thì hiện created_at (không còn '—')", () => {
    withCourses([buildCourse({ submitted_at: null, created_at: "2026-09-20T00:00:00Z" })]);
    render(<AdminCoursesPage />);

    expect(screen.getByText("20/09/2026")).toBeTruthy();
    expect(screen.queryByText("—")).toBeNull();
  });

  it("ưu tiên submitted_at hơn created_at khi cả hai có", () => {
    withCourses([
      buildCourse({ submitted_at: "2026-09-28T00:00:00Z", created_at: "2026-09-20T00:00:00Z" }),
    ]);
    render(<AdminCoursesPage />);

    expect(screen.getByText("28/09/2026")).toBeTruthy();
    expect(screen.queryByText("20/09/2026")).toBeNull();
  });
});
