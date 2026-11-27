/**
 * Q9-PG-03: lỗi tải khoá học (5xx, mất mạng) chỉ có khối đỏ, không có cách thử lại ngoài tải lại cả trang
 * (trang giảng viên, cuộc thi, diễn đàn đều có nút "Thử lại").
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refetch = vi.hoisted(() => vi.fn());
const hookState = vi.hoisted(() => ({ data: undefined as unknown }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "hinh-hoc" }),
  useRouter: () => ({ push: vi.fn() }),
  notFound: () => {
    throw new Error("notFound");
  },
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (select: (s: { isAuthenticated: boolean }) => unknown) => select({ isAuthenticated: false }),
}));
vi.mock("@/hooks/use-courses", () => ({
  useCourseBySlug: () => ({ isLoading: false, error: new Error("Không thể tải"), data: hookState.data, refetch }),
  useEnrolledCourses: () => ({ data: [], isLoading: false }),
  useEnrollCourse: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@/components/course/course-detail-header", () => ({ CourseDetailHeader: () => <div>course-header</div> }));
vi.mock("@/components/course/course-detail-content", () => ({ CourseDetailContent: () => null }));
vi.mock("@/components/course/course-detail-sidebar", () => ({ CourseDetailSidebar: () => null }));
vi.mock("@/hooks/queries/use-reviews", () => ({ useCourseReviews: () => ({ data: undefined }) }));

import CourseDetailPage from "./page";

beforeEach(() => {
  refetch.mockReset().mockResolvedValue(undefined);
  hookState.data = undefined;
});

describe("CourseDetailPage — API lỗi (Q9-PG-03)", () => {
  it("hiện 'Lỗi tải khoá học' kèm nút Thử lại gọi refetch", () => {
    render(<CourseDetailPage />);
    expect(screen.getByText("Lỗi tải khoá học")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  // Review #142 M2: refetch nền lỗi sau khi đã có khoá học thì giữ nội dung, không thay bằng khối lỗi.
  it("đã có dữ liệu khoá học (refetch nền lỗi): giữ trang, không hiện khối lỗi", () => {
    hookState.data = { id: "c1", slug: "hinh-hoc", title: "Hình học", price: 0, sections: [] };
    render(<CourseDetailPage />);
    expect(screen.getByText("course-header")).toBeTruthy();
    expect(screen.queryByText("Lỗi tải khoá học")).toBeNull();
  });
});
