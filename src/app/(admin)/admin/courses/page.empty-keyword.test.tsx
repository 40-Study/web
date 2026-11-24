/** QA5-A04: tìm khoá học không khớp trên tab "Chờ duyệt" từng ghi "Hiện không có khoá học nào chờ duyệt" (đọc như hàng chờ trống). */
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAdminCourses = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/courses",
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("@/hooks/queries/use-course-approval", () => ({
  useAdminCourses: (...args: unknown[]) => mockUseAdminCourses(...args),
  useApproveCourse: () => ({ mutate: vi.fn(), isPending: false }),
  useRejectCourse: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/components/admin/course-review-detail-dialog", () => ({ CourseReviewDetailDialog: () => null }));
const authState = { permissions: ["COURSES_APPROVE_ALL"], sessionStatus: "authenticated" as const };
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

// eslint-disable-next-line import/first
import AdminCoursesPage from "./page";

beforeEach(() => {
  vi.useFakeTimers();
  mockUseAdminCourses.mockReturnValue({
    data: { courses: [], total: 0, page: 1, page_size: 20 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
});
afterEach(() => vi.useRealTimers());

describe("/admin/courses — trạng thái rỗng", () => {
  it("có từ khoá: nói không khớp từ khoá, không nói hàng chờ trống", () => {
    search = "keyword=zzz";
    render(<AdminCoursesPage />);
    act(() => vi.advanceTimersByTime(350));
    expect(screen.getByText("Không có khoá học khớp “zzz”.")).toBeTruthy();
    expect(screen.queryByText("Hiện không có khoá học nào chờ duyệt.")).toBeNull();
  });

  it("không từ khoá, tab Chờ duyệt: giữ câu hàng chờ trống", () => {
    search = "";
    render(<AdminCoursesPage />);
    expect(screen.getByText("Hiện không có khoá học nào chờ duyệt.")).toBeTruthy();
  });
});
