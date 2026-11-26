/** QA8-A11: lọc trạng thái khoá học nằm trên URL (?status=), mở link là đã lọc sẵn và đổi bộ lọc ghi lại URL. */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAdminCourses = vi.fn();
const replace = vi.fn();
let search = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/admin/courses",
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("@/hooks/queries/use-course-approval", () => ({
  useAdminCourses: (...args: unknown[]) => mockUseAdminCourses(...args),
  useApproveCourse: () => ({ mutate: vi.fn(), isPending: false }),
  useRejectCourse: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/components/admin/course-review-detail-dialog", () => ({ CourseReviewDetailDialog: () => null }));
vi.mock("@/stores/auth.store", () => {
  const state = { permissions: ["COURSES_APPROVE_ALL"], sessionStatus: "authenticated" };
  return { useAuthStore: (selector: (s: typeof state) => unknown) => selector(state) };
});

import AdminCoursesPage from "./page";

beforeEach(() => {
  replace.mockReset();
  mockUseAdminCourses.mockReset();
  mockUseAdminCourses.mockReturnValue({
    data: { courses: [], total: 0, page: 1, page_size: 20 }, isLoading: false, isError: false, error: null, refetch: vi.fn(),
  });
});

describe("/admin/courses — QA8-A11 bộ lọc trạng thái trên URL", () => {
  it("mở ?status=published: ô lọc và truy vấn dùng 'published'", () => {
    search = "status=published";
    render(<AdminCoursesPage />);
    expect((screen.getByTestId("course-status-filter") as HTMLSelectElement).value).toBe("published");
    expect(mockUseAdminCourses.mock.calls.at(-1)?.[0]).toMatchObject({ status: "published" });
  });

  it("?status= lạ rơi về 'Chờ duyệt'", () => {
    search = "status=hack";
    render(<AdminCoursesPage />);
    expect((screen.getByTestId("course-status-filter") as HTMLSelectElement).value).toBe("pending_review");
  });

  it("đổi bộ lọc ghi status lên URL bằng replace", () => {
    search = "";
    render(<AdminCoursesPage />);
    fireEvent.change(screen.getByTestId("course-status-filter"), { target: { value: "published" } });
    expect(replace).toHaveBeenCalledWith("/admin/courses?status=published", { scroll: false });
  });
});
