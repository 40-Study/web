/**
 * QA4-A16: /admin/courses bỏ qua ?keyword= và không ghi ô tìm kiếm lên URL, nên F5/quay lại mất tìm kiếm.
 * Nay giống /admin/users: mở link có ?keyword= là đã lọc sẵn, gõ thì URL cập nhật (replace).
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
const authState = { permissions: ["COURSES_APPROVE_ALL"], sessionStatus: "authenticated" as const };
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

// eslint-disable-next-line import/first
import AdminCoursesPage from "./page";

beforeEach(() => {
  vi.useFakeTimers();
  replace.mockReset();
  mockUseAdminCourses.mockReset();
  mockUseAdminCourses.mockReturnValue({
    data: { courses: [], total: 0, page: 1, page_size: 20 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
});
afterEach(() => vi.useRealTimers());

describe("/admin/courses — QA4-A16: từ khoá đồng bộ với URL", () => {
  it("mở /admin/courses?keyword=nhom: ô tìm có sẵn từ khoá và truy vấn đã lọc, không ghi lại URL thừa", () => {
    search = "keyword=nhom";
    render(<AdminCoursesPage />);
    act(() => vi.advanceTimersByTime(350));

    expect((screen.getByLabelText("Tìm khoá học") as HTMLInputElement).value).toBe("nhom");
    expect(mockUseAdminCourses).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: "nhom" }));
    expect(replace).not.toHaveBeenCalled();
  });

  it("gõ từ khoá thì ghi ?keyword= (đã trim) lên URL; xoá ô thì bỏ tham số", () => {
    search = "";
    const { rerender } = render(<AdminCoursesPage />);
    fireEvent.change(screen.getByLabelText("Tìm khoá học"), { target: { value: "  toan  " } });
    act(() => vi.advanceTimersByTime(350));
    expect(replace).toHaveBeenLastCalledWith("/admin/courses?keyword=toan", { scroll: false });

    search = "keyword=toan";
    rerender(<AdminCoursesPage />);
    fireEvent.change(screen.getByLabelText("Tìm khoá học"), { target: { value: "" } });
    act(() => vi.advanceTimersByTime(350));
    expect(replace).toHaveBeenLastCalledWith("/admin/courses", { scroll: false });
  });
});
