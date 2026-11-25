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
let latestOnSearch: (q: string) => void = () => {};
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
vi.mock("@/components/course/course-search", () => ({
  CourseSearch: ({ onSearch }: { onSearch: (q: string) => void }) => {
    latestOnSearch = onSearch;
    return null;
  },
}));
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

  // M4: kéo nhanh thanh giá/chip — mỗi lần là một router.replace; URL của lần cũ có thể báo về SAU state mới.
  it("URL cũ do chính trang ghi báo về muộn KHÔNG kéo bộ lọc giật lại (M4)", () => {
    const { rerender } = render(<CoursesPage />);
    act(() => latestOnFilterChange({ sortBy: "newest" }));
    act(() => latestOnFilterChange({ sortBy: "rating" }));
    expect(screen.getByTestId("filters").getAttribute("data-sort")).toBe("rating");

    currentParams = new URLSearchParams("sort=newest"); // lần ghi cũ hạ cánh trước
    rerender(<CoursesPage />);
    expect(screen.getByTestId("filters").getAttribute("data-sort")).toBe("rating");

    currentParams = new URLSearchParams("sort=rating"); // rồi lần ghi mới nhất
    rerender(<CoursesPage />);
    expect(screen.getByTestId("filters").getAttribute("data-sort")).toBe("rating");
  });

  it("các lần ghi bị gộp (URL nhảy thẳng tới bản mới) không để sót sổ ghi: điều hướng ngoài sau đó vẫn đồng bộ", () => {
    const { rerender } = render(<CoursesPage />);
    act(() => latestOnFilterChange({ sortBy: "newest" }));
    act(() => latestOnFilterChange({ sortBy: "rating" }));
    currentParams = new URLSearchParams("sort=rating");
    rerender(<CoursesPage />);

    currentParams = new URLSearchParams("sort=newest"); // bấm Danh mục/Back từ ngoài, cùng khoá với một lần ghi cũ
    rerender(<CoursesPage />);
    expect(screen.getByTestId("filters").getAttribute("data-sort")).toBe("newest");
  });

  it("điều hướng ngoài (header/Back) vẫn đồng bộ dù trang đã tự ghi trước đó", () => {
    const { rerender } = render(<CoursesPage />);
    act(() => latestOnFilterChange({ category: "lap-trinh-web" }));
    currentParams = new URLSearchParams("category=lap-trinh-web");
    rerender(<CoursesPage />);
    currentParams = new URLSearchParams("category=thiet-ke");
    rerender(<CoursesPage />);
    expect(screen.getByTestId("filters").getAttribute("data-category")).toBe("thiet-ke");
  });

  // L3: xoá ô tìm kiếm phải bỏ luôn ?q= cũ, nếu không chọn chip rồi tải lại sẽ hiện lại từ khoá đã xoá.
  it("xoá ô tìm kiếm bỏ ?q= khỏi URL và giữ bộ lọc (L3)", () => {
    currentParams = new URLSearchParams("q=python&category=thiet-ke");
    render(<CoursesPage />);
    act(() => latestOnSearch(""));
    expect(replace).toHaveBeenCalledWith("/courses?category=thiet-ke", { scroll: false });
  });

  it("chọn chip sau khi xoá ô tìm kiếm không đưa ?q= cũ trở lại (L3)", () => {
    currentParams = new URLSearchParams("q=python");
    const { rerender } = render(<CoursesPage />);
    act(() => latestOnSearch(""));
    currentParams = new URLSearchParams(); // URL đã bỏ q
    rerender(<CoursesPage />);
    act(() => latestOnFilterChange({ category: "thiet-ke" }));
    expect(replace).toHaveBeenLastCalledWith("/courses?category=thiet-ke", { scroll: false });
  });

  // Q6 #133 R3: chip được chọn khi lần ghi "bỏ q" chưa hạ cánh (searchParams còn q cũ) không được đưa q trở lại.
  it("chọn chip khi lần bỏ ?q= chưa hạ cánh (searchParams còn q cũ) không đưa q trở lại (R3)", () => {
    currentParams = new URLSearchParams("q=python");
    render(<CoursesPage />);
    act(() => latestOnSearch("")); // URL chưa cập nhật: currentParams vẫn có q=python
    act(() => latestOnFilterChange({ category: "thiet-ke" }));
    expect(replace).toHaveBeenLastCalledWith("/courses?category=thiet-ke", { scroll: false });
  });

  it("q đổi từ ngoài sau lần bỏ q (điều hướng mới tới ?q=) thì ghi bộ lọc giữ q mới (R3)", () => {
    currentParams = new URLSearchParams("q=python");
    const { rerender } = render(<CoursesPage />);
    act(() => latestOnSearch(""));
    currentParams = new URLSearchParams(); // lần bỏ q hạ cánh
    rerender(<CoursesPage />);
    currentParams = new URLSearchParams("q=java"); // người dùng tìm "java" từ header
    rerender(<CoursesPage />);
    act(() => latestOnFilterChange({ category: "thiet-ke" }));
    expect(replace).toHaveBeenLastCalledWith("/courses?q=java&category=thiet-ke", { scroll: false });
  });

  // Q6 #133 R3: lần ghi không bao giờ hạ cánh không được nuốt một điều hướng ngoài về đúng khoá đó về sau.
  it("lần ghi không hạ cánh quá hạn thì điều hướng ngoài về đúng khoá đó vẫn đồng bộ lại bộ lọc (R3)", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const { rerender } = render(<CoursesPage />);
      act(() => latestOnFilterChange({ category: "thiet-ke" })); // ghi k1, URL chưa báo lại
      act(() => latestOnFilterChange({})); // kéo ngược về k0 trong cùng nhịp: không ghi thêm
      vi.setSystemTime(Date.now() + 10_000);
      currentParams = new URLSearchParams("category=thiet-ke"); // header pill: điều hướng ngoài tới k1
      rerender(<CoursesPage />);
      expect(screen.getByTestId("filters").getAttribute("data-category")).toBe("thiet-ke");
    } finally {
      vi.useRealTimers();
    }
  });

  it("cùng tình huống nhưng URL báo lại NGAY (chưa quá hạn) vẫn coi là lần ghi của chính trang, giữ state mới", () => {
    const { rerender } = render(<CoursesPage />);
    act(() => latestOnFilterChange({ category: "thiet-ke" }));
    act(() => latestOnFilterChange({}));
    currentParams = new URLSearchParams("category=thiet-ke"); // URL cũ của lần ghi k1 tới muộn
    rerender(<CoursesPage />);
    expect(screen.getByTestId("filters").getAttribute("data-category")).toBe("");
  });

  // #134 L-1: TTL theo từng mục coi lần ghi cũ hạ cánh muộn (router chậm trên di động) là điều hướng ngoài.
  it("hai lần ghi, URL của lần ghi ĐẦU hạ cánh sau hơn 3s kể từ lúc ghi nó nhưng còn sớm so với lần ghi cuối: không giật lại (L-1)", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const { rerender } = render(<CoursesPage />);
      act(() => latestOnFilterChange({ sortBy: "newest" })); // ghi k1
      vi.setSystemTime(Date.now() + 2_000);
      act(() => latestOnFilterChange({ sortBy: "rating" })); // ghi k2
      vi.setSystemTime(Date.now() + 2_500); // k1 đã 4,5 s tuổi, k2 mới 2,5 s
      currentParams = new URLSearchParams("sort=newest"); // router chậm: URL của k1 mới hạ cánh
      rerender(<CoursesPage />);
      expect(screen.getByTestId("filters").getAttribute("data-sort")).toBe("rating");
    } finally {
      vi.useRealTimers();
    }
  });

  it("không có ?q= thì tìm kiếm rỗng không ghi URL", () => {
    render(<CoursesPage />);
    act(() => latestOnSearch(""));
    expect(replace).not.toHaveBeenCalled();
  });
});
