/**
 * QA3 Q17: đăng ký khoá miễn phí hiện HAI toast chồng nhau — một từ `useEnrollCourse`, một từ trang.
 * Trang không được tự phát toast thành công nữa.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "hinh-hoc" }),
  useRouter: () => ({ push: vi.fn() }),
  notFound: () => {
    throw new Error("notFound");
  },
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (select: (s: { isAuthenticated: boolean }) => unknown) => select({ isAuthenticated: true }),
}));
const mutateAsync = vi.fn().mockResolvedValue({});
vi.mock("@/hooks/use-courses", () => ({
  useCourseBySlug: () => ({
    isLoading: false,
    error: null,
    data: { id: "c1", slug: "hinh-hoc", title: "Hình học", price: 0, sections: [] },
  }),
  useEnrolledCourses: () => ({ data: [], isLoading: false }),
  useEnrollCourse: () => ({ mutateAsync }),
}));
vi.mock("@/hooks/queries/use-reviews", () => ({ useCourseReviews: () => ({ data: undefined }) }));
vi.mock("@/components/course/course-detail-header", () => ({ CourseDetailHeader: () => null }));
vi.mock("@/components/course/course-detail-content", () => ({ CourseDetailContent: () => null }));
vi.mock("@/components/course/course-detail-sidebar", () => ({
  CourseDetailSidebar: ({ onEnroll }: { onEnroll: () => void }) => <button onClick={onEnroll}>enroll</button>,
}));

import CourseDetailPage from "./page";

describe("CourseDetailPage — đăng ký (Q17)", () => {
  it("không phát toast thành công của riêng trang (hook đã phát một toast)", async () => {
    render(<CourseDetailPage />);
    fireEvent.click(screen.getByText("enroll"));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith("c1"));
    expect(toast.success).not.toHaveBeenCalled();
  });
});
