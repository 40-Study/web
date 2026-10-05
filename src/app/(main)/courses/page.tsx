"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CourseGrid } from "@/components/course/course-grid";
import { CourseFiltersComponent } from "@/components/course/course-filters";
import { CourseSearch } from "@/components/course/course-search";
import { CourseBannerCarousel } from "@/components/course/course-banner-carousel";
import { Button } from "@/components/ui/button";
import { useCourses, useCategories, useSearchSuggestions } from "@/hooks/use-courses";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CourseFilters } from "@/types/course";

/** Số card hiển thị mỗi lượt. Dữ liệu đã tải đủ một lần, "Tải thêm" chỉ mở rộng phần hiển thị. */
const PAGE_SIZE = 12;

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  // Pill Danh mục trên header điều hướng tới /courses?category=<slug> — đọc sẵn để pill tương ứng
  // được chọn từ đầu. Chỉ nhận slug có thật trong danh mục; slug lạ bỏ qua im lặng (không kẹt filter).
  const initialCategory = searchParams.get("category") || undefined;

  const [filters, setFilters] = useState<CourseFilters>({ category: initialCategory });
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Debounce 300ms: `useSearchSuggestions` gọi API gợi ý theo từng ký tự.
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const { data: allCourses = [], isLoading: coursesLoading } = useCourses(filters);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: suggestions = [] } = useSearchSuggestions(debouncedSearchQuery);

  // Đã ở /courses mà bấm Danh mục khác (cùng component, không remount) → đồng bộ lại filter theo URL.
  const categoryParam = searchParams.get("category") || undefined;
  useEffect(() => {
    setFilters((f) => (f.category === categoryParam ? f : { ...f, category: categoryParam }));
    setVisibleCount(PAGE_SIZE);
  }, [categoryParam]);

  // Slug lạ từ URL (vd. dữ liệu test rác) bị bỏ qua để không kẹt filter 0 kết quả âm thầm —
  // chỉ clear MỘT LẦN khi danh mục đã tải xong và slug vẫn không khớp.
  useEffect(() => {
    if (
      filters.category &&
      categories.length > 0 &&
      !categories.some((c) => c.slug === filters.category)
    ) {
      setFilters((f) => ({ ...f, category: undefined }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi danh sách danh mục hoặc slug trên URL đổi
  }, [categories, filters.category]);

  // Filter courses by search query (API filters handled by useCourses)
  const filteredCourses = searchQuery
    ? allCourses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allCourses;

  const visibleCourses = filteredCourses.slice(0, visibleCount);
  const hasMore = filteredCourses.length > visibleCount;
  const isLoading = coursesLoading || categoriesLoading;
  const hasActiveFilters = Boolean(
    searchQuery ||
      filters.category ||
      filters.levels?.length ||
      filters.priceMin !== undefined ||
      filters.priceMax !== undefined
  );

  const handleFilterChange = (newFilters: CourseFilters) => {
    setFilters(newFilters);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setVisibleCount(PAGE_SIZE);
  };

  const clearAll = () => {
    setFilters({ sortBy: filters.sortBy });
    setSearchQuery("");
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container space-y-8 py-6 md:space-y-10 lg:py-8 xl:space-y-12">
        {/* Header: tiêu đề + tìm kiếm */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-h1 text-slate-900 dark:text-slate-50">Khám phá khóa học</h1>
            <p className="text-body mt-2 text-slate-600 dark:text-slate-400">
              Cập nhật liên tục
            </p>
          </div>
          <div className="w-full md:w-[22rem] md:shrink-0">
            <CourseSearch
              onSearch={handleSearch}
              suggestions={suggestions}
              placeholder="Tìm trong danh sách…"
            />
          </div>
        </header>

        <CourseBannerCarousel />

        <div className="space-y-4 md:space-y-5">
          <CourseFiltersComponent
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {!isLoading && (
            <p className="text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
              {filteredCourses.length} khóa học
              {searchQuery && ` cho "${searchQuery}"`}
            </p>
          )}

          <CourseGrid
            courses={visibleCourses}
            loading={isLoading}
            staggered
            emptyAction={
              hasActiveFilters ? (
                <Button type="button" variant="outline" onClick={clearAll}>
                  Xóa bộ lọc
                </Button>
              ) : undefined
            }
          />

          {hasMore && !isLoading && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="secondary"
                className="dark:bg-slate-800 dark:text-primary-300 dark:hover:bg-slate-700"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                Tải thêm khóa học
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
