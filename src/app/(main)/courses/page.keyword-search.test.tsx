/**
 * F-07 (smoke 2, QA2 261013): /courses lọc danh sách ở client bằng `toLowerCase().includes` nên gõ
 * "dai so" không ra "Đại số tuyến tính" dù backend `keyword` đã tìm không dấu. Trang phải đẩy từ khoá
 * lên backend và hiển thị đúng kết quả backend trả, không lọc lại ở client.
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let currentParams = new URLSearchParams();
const useCoursesMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => currentParams,
}));

vi.mock("@/components/course/course-grid", () => ({
  CourseGrid: ({ courses }: { courses: Array<{ id: string; title: string }> }) => (
    <ul data-testid="grid">
      {courses.map((c) => (
        <li key={c.id}>{c.title}</li>
      ))}
    </ul>
  ),
}));
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

const backendResult = [{ id: "1", title: "Đại số tuyến tính ứng dụng", instructor: { name: "A" }, description: "" }];

describe("CoursesPage — tìm kiếm qua backend keyword (F-07)", () => {
  beforeEach(() => {
    currentParams = new URLSearchParams();
    useCoursesMock.mockReset();
    useCoursesMock.mockReturnValue({ data: backendResult, isLoading: false });
  });

  it("?q=dai so được gửi lên backend làm keyword", () => {
    currentParams = new URLSearchParams("q=dai so");
    render(<CoursesPage />);
    expect(useCoursesMock).toHaveBeenCalledWith(expect.objectContaining({ keyword: "dai so" }));
  });

  it("hiển thị đúng kết quả backend trả về, không lọc lại không-dấu ở client", () => {
    currentParams = new URLSearchParams("q=dai so");
    render(<CoursesPage />);
    expect(screen.getByText("Đại số tuyến tính ứng dụng")).toBeTruthy();
    expect(screen.getByText(/1 khoá học cho "dai so"/)).toBeTruthy();
  });

  it("không có q thì không gửi keyword", () => {
    render(<CoursesPage />);
    const filters = useCoursesMock.mock.calls[0]?.[0] as { keyword?: string };
    expect(filters.keyword).toBeUndefined();
  });
});
