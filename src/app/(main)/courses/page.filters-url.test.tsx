/**
 * Q6-PG-11: chọn chip danh mục / bộ lọc từng chỉ nằm trong useState: tải lại hiện lại 52 khoá, Back rời trang.
 * Bộ lọc phải ghi lên URL (router.replace), giữ nguyên `q`, và đọc lại từ URL khi tải trang / Back.
 */
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseFilters } from "@/types/course";

let currentParams = new URLSearchParams();
const replace = vi.fn();
let latestOnFilterChange: (f: CourseFilters) => void = () => {};
const useCoursesMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => currentParams,
}));
vi.mock("@/components/course/course-grid", () => ({
  CourseGrid: ({ emptyAction }: { emptyAction?: React.ReactNode }) => <div data-testid="grid">{emptyAction}</div>,
}));
vi.mock("@/components/course/course-filters", () => ({
  CourseFiltersComponent: ({ filters, onFilterChange }: { filters: CourseFilters; onFilterChange: (f: CourseFilters) => void }) => {
    latestOnFilterChange = onFilterChange;
    return <div data-testid="filters" data-category={filters.category ?? ""} data-sort={filters.sortBy ?? ""} />;
  },
}));
vi.mock("@/components/course/course-search", () => ({ CourseSearch: () => null }));
vi.mock("@/components/course/course-banner-carousel", () => ({ CourseBannerCarousel: () => null }));
vi.mock("@/hooks/use-courses", () => ({
  useCourses: (f: unknown) => useCoursesMock(f),
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

beforeEach(() => {
  currentParams = new URLSearchParams();
  replace.mockReset();
  useCoursesMock.mockReset().mockReturnValue({ data: [], isLoading: false });
});

describe("CoursesPage — bộ lọc trên URL", () => {
  it("chọn danh mục ghi ?category= lên URL bằng router.replace", () => {
    render(<CoursesPage />);
    act(() => latestOnFilterChange({ category: "lap-trinh-web" }));
    expect(replace).toHaveBeenCalledWith("/courses?category=lap-trinh-web", { scroll: false });
    expect(screen.getByTestId("filters").getAttribute("data-category")).toBe("lap-trinh-web");
  });

  it("giữ nguyên q và ghi thêm sort", () => {
    currentParams = new URLSearchParams("q=python");
    render(<CoursesPage />);
    act(() => latestOnFilterChange({ sortBy: "newest" }));
    expect(replace).toHaveBeenCalledWith("/courses?q=python&sort=newest", { scroll: false });
  });

  it("bỏ hết bộ lọc: URL về /courses", () => {
    currentParams = new URLSearchParams("category=thiet-ke");
    render(<CoursesPage />);
    act(() => latestOnFilterChange({}));
    expect(replace).toHaveBeenCalledWith("/courses", { scroll: false });
  });

  it("tải trang với ?category=&sort= khôi phục bộ lọc và gửi lên useCourses", () => {
    currentParams = new URLSearchParams("category=thiet-ke&sort=rating");
    render(<CoursesPage />);
    expect(screen.getByTestId("filters").getAttribute("data-category")).toBe("thiet-ke");
    expect(screen.getByTestId("filters").getAttribute("data-sort")).toBe("rating");
    expect(useCoursesMock).toHaveBeenCalledWith(expect.objectContaining({ category: "thiet-ke", sortBy: "rating" }));
  });

  it("Back/Forward (URL đổi) đồng bộ lại bộ lọc", () => {
    currentParams = new URLSearchParams("category=thiet-ke");
    const { rerender } = render(<CoursesPage />);
    currentParams = new URLSearchParams("category=lap-trinh-web");
    rerender(<CoursesPage />);
    expect(screen.getByTestId("filters").getAttribute("data-category")).toBe("lap-trinh-web");
  });
});
