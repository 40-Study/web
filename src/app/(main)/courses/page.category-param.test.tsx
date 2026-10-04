/**
 * Header pill "Danh mục" điều hướng tới /courses?category=<slug> — trang phải đọc param này để pill
 * tương ứng được chọn sẵn (filters.category khởi tạo từ URL). Slug lạ phải bị bỏ qua (không kẹt
 * filter 0 kết quả âm thầm).
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let currentParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => currentParams,
}));

vi.mock("@/components/course/course-grid", () => ({
  CourseGrid: () => <div data-testid="grid" />,
}));
vi.mock("@/components/course/course-filters", () => ({
  CourseFiltersComponent: ({ filters }: { filters: { category?: string } }) => (
    <div data-testid="filters" data-category={filters.category ?? ""} />
  ),
}));
vi.mock("@/components/course/course-search", () => ({ CourseSearch: () => null }));
vi.mock("@/components/course/course-banner-carousel", () => ({
  CourseBannerCarousel: () => null,
}));

vi.mock("@/hooks/use-courses", () => ({
  useCourses: () => ({ data: [], isLoading: false }),
  useCategories: () => ({
    data: [
      { id: "c1", name: "Lập trình Web", slug: "lap-trinh-web" },
      { id: "c2", name: "Thiết kế", slug: "thiet-ke" },
    ],
    isLoading: false,
  }),
  useSearchSuggestions: () => ({ data: [] }),
}));

// eslint-disable-next-line import/first
import CoursesPage from "./page";

describe("CoursesPage — đọc query param category", () => {
  beforeEach(() => {
    currentParams = new URLSearchParams();
  });

  it("?category=<slug> khởi tạo filter danh mục tương ứng", () => {
    currentParams = new URLSearchParams("category=lap-trinh-web");
    render(<CoursesPage />);
    expect(screen.getByTestId("filters").getAttribute("data-category")).toBe("lap-trinh-web");
  });

  it("slug lạ (không có trong danh mục) bị bỏ qua — filter rỗng", () => {
    currentParams = new URLSearchParams("category=qa-hack-cat");
    render(<CoursesPage />);
    expect(screen.getByTestId("filters").getAttribute("data-category")).toBe("");
  });

  it("không có param thì filter rỗng", () => {
    render(<CoursesPage />);
    expect(screen.getByTestId("filters").getAttribute("data-category")).toBe("");
  });
});
