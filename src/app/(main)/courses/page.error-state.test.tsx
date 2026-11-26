/**
 * Q8-PG-03: khi API danh sách khoá học lỗi, /courses từng hiện "0 khoá học" và "Không tìm thấy khoá học nào" như thể chưa có
 * khoá nào (trang chỉ đọc `isLoading`). Phải nói là lỗi và cho "Thử lại", giống /contests.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useCoursesMock = vi.fn();
const refetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/course/course-grid", () => ({ CourseGrid: () => <div data-testid="grid" /> }));
vi.mock("@/components/course/course-filters", () => ({ CourseFiltersComponent: () => null }));
vi.mock("@/components/course/course-search", () => ({ CourseSearch: () => null }));
vi.mock("@/components/course/course-banner-carousel", () => ({ CourseBannerCarousel: () => null }));
vi.mock("@/hooks/use-courses", () => ({
  useCourses: (filters: unknown) => useCoursesMock(filters),
  useCategories: () => ({ data: [], isLoading: false }),
  useSearchSuggestions: () => ({ data: [] }),
}));

// eslint-disable-next-line import/first
import CoursesPage from "./page";

beforeEach(() => {
  refetch.mockReset();
  useCoursesMock.mockReset();
});

describe("CoursesPage — API lỗi (Q8-PG-03)", () => {
  it("hiện lỗi + Thử lại, không hiện '0 khoá học' hay lưới rỗng", () => {
    useCoursesMock.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("boom"), refetch });
    render(<CoursesPage />);

    expect(screen.getByRole("alert").textContent).toMatch(/Không thể tải dữ liệu/);
    expect(screen.queryByText(/0 khoá học/)).toBeNull();
    expect(screen.queryByTestId("grid")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("không lỗi: vẫn hiện số lượng và lưới như trước", () => {
    useCoursesMock.mockReturnValue({ data: [], isLoading: false, isError: false, error: null, refetch });
    render(<CoursesPage />);
    expect(screen.getByText("0 khoá học")).toBeTruthy();
    expect(screen.getByTestId("grid")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  // M2 (review #139): refetch nền lỗi nhưng react-query còn `data` cũ thì danh sách đang xem không được thay bằng hộp lỗi.
  it("refetch nền lỗi nhưng còn dữ liệu cũ: giữ lưới, không hiện hộp lỗi", () => {
    useCoursesMock.mockReturnValue({ data: [{ id: "c1" }], isLoading: false, isError: true, error: new Error("boom"), refetch });
    render(<CoursesPage />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByTestId("grid")).toBeTruthy();
    expect(screen.getByText("1 khoá học")).toBeTruthy();
  });
});
