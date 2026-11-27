/**
 * Q10-PG-04: GET /categories lỗi từng bị bỏ qua (trang chỉ đọc `data`), hàng chip chỉ còn "Tất cả" và trang trông như đủ.
 * Phải báo lỗi và cho "Thử lại" cạnh bộ lọc.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refetchCategories = vi.fn();
let categoriesState: Record<string, unknown> = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/course/course-grid", () => ({ CourseGrid: () => <div data-testid="grid" /> }));
vi.mock("@/components/course/course-filters", () => ({ CourseFiltersComponent: () => <div data-testid="filters" /> }));
vi.mock("@/components/course/course-search", () => ({ CourseSearch: () => null }));
vi.mock("@/components/course/course-banner-carousel", () => ({ CourseBannerCarousel: () => null }));
vi.mock("@/hooks/use-courses", () => ({
  useCourses: () => ({ data: [], isLoading: false, isError: false, error: null, refetch: vi.fn() }),
  useCategories: () => categoriesState,
  useSearchSuggestions: () => ({ data: [] }),
}));

import CoursesPage from "./page";

beforeEach(() => refetchCategories.mockReset());

describe("CoursesPage — danh mục lỗi (Q10-PG-04)", () => {
  it("categories lỗi + chưa có danh mục: thông báo + 'Thử lại', bấm thì gọi refetch", () => {
    categoriesState = { data: undefined, isLoading: false, isError: true, refetch: refetchCategories };
    render(<CoursesPage />);
    expect(screen.getByRole("alert").textContent).toContain("Không tải được danh mục");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchCategories).toHaveBeenCalledTimes(1);
  });

  it("categories ổn: không có thông báo", () => {
    categoriesState = { data: [{ id: "c1", name: "Toán", slug: "toan" }], isLoading: false, isError: false, refetch: refetchCategories };
    render(<CoursesPage />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText(/Không tải được danh mục/)).toBeNull();
  });
});
