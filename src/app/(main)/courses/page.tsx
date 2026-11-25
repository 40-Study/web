"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CourseGrid } from "@/components/course/course-grid";
import { CourseFiltersComponent } from "@/components/course/course-filters";
import { CourseSearch } from "@/components/course/course-search";
import { CourseBannerCarousel } from "@/components/course/course-banner-carousel";
import { Button } from "@/components/ui/button";
import { useCourses, useCategories, useSearchSuggestions } from "@/hooks/use-courses";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CourseFilters } from "@/types/course";
import { applyCourseFiltersToParams, courseFilterKey, parseCourseFilterParams } from "@/lib/course-filter-query";

/** Số card hiển thị mỗi lượt. Dữ liệu đã tải đủ một lần, "Tải thêm" chỉ mở rộng phần hiển thị. */
const PAGE_SIZE = 12;

/**
 * Quá thời gian này KỂ TỪ LẦN GHI CUỐI mà URL vẫn chưa báo lại thì coi các lần ghi bộ lọc là không bao giờ hạ cánh (xem sổ
 * `writtenKeysRef`). Tính theo lần ghi cuối chứ không theo từng mục, và đủ rộng cho `router.replace` chậm trên di động:
 * 3 giây theo từng mục khiến một lần ghi cũ hạ cánh muộn bị coi là điều hướng ngoài và kéo bộ lọc giật về giá trị cũ
 * (Q7, #134 L-1).
 */
const WRITTEN_KEY_TTL_MS = 10_000;

export default function CoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  // Pill Danh mục trên header điều hướng tới /courses?category=<slug> — đọc sẵn để pill tương ứng
  // được chọn từ đầu. Chỉ nhận slug có thật trong danh mục; slug lạ bỏ qua im lặng (không kẹt filter).
  // Q6-PG-11: cả bộ lọc (danh mục, cấp độ, giá, sắp xếp) nằm trên URL để tải lại / chia sẻ link không mất.
  const [filters, setFilters] = useState<CourseFilters>(() => parseCourseFilterParams(searchParams));
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Debounce 300ms: `useSearchSuggestions` gọi API gợi ý theo từng ký tự.
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // Từ khoá tìm ở backend (`keyword`, không phân biệt dấu) — trước đây lọc ở client bằng
  // `toLowerCase().includes` nên "dai so" không ra "Đại số" (F-07). `searchQuery` đã được CourseSearch debounce 300ms.
  const { data: allCourses = [], isLoading: coursesLoading } = useCourses({
    ...filters,
    keyword: searchQuery || undefined,
  });
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: suggestions = [] } = useSearchSuggestions(debouncedSearchQuery);

  // Khoá bộ lọc mà CHÍNH trang này vừa ghi lên URL (theo thứ tự ghi) và chưa thấy URL báo lại. Mỗi lần router.replace
  // hoàn tất là một lần `urlFilterKey` đổi; khi kéo thanh giá nhanh, URL cũ có thể báo về SAU state mới. Không có sổ
  // này, effect bên dưới coi nó là điều hướng ngoài và kéo bộ lọc (kể cả thanh trượt) giật về giá trị cũ (Q6-PG-11, M4).
  const writtenKeysRef = useRef<{ key: string; at: number }[]>([]);
  // Q6 #133 R3: đã ghi một lần bỏ `?q=` nhưng `searchParams` (đọc ở lần render trước) có thể còn `q` cũ. Chọn chip lúc đó mà
  // copy `searchParams` sẽ đưa `q` đã xoá trở lại URL. Cờ này nhớ "q đã bị bỏ" tới khi URL báo lại hoặc `q` đổi từ ngoài.
  const queryDroppedRef = useRef(false);
  const urlQuery = searchParams.get("q");
  useEffect(() => {
    queryDroppedRef.current = false;
  }, [urlQuery]);

  // Bấm Danh mục khác ở header (push một mục lịch sử mới), hoặc Back/Forward giữa các mục đó (cùng component, không
  // remount) → đồng bộ lại bộ lọc theo URL. Ghi bộ lọc ở đây dùng replace nên KHÔNG tạo mục lịch sử. Chỉ chạy khi phần
  // bộ lọc trên URL đổi, nên gõ từ khoá không ghi đè bộ lọc đang chọn.
  const urlFilterKey = courseFilterKey(parseCourseFilterParams(searchParams));
  useEffect(() => {
    // Q6 #133 R3: một lần ghi mà URL không bao giờ báo lại (ghi rồi ghi ngược về khoá cũ trong một nhịp router) không được nằm
    // trong sổ mãi và nuốt một điều hướng ngoài về đúng khoá đó về sau: cả sổ hết hạn khi lần ghi CUỐI đã quá hạn.
    const written = writtenKeysRef.current;
    const lastWriteAt = written[written.length - 1]?.at;
    if (lastWriteAt !== undefined && Date.now() - lastWriteAt >= WRITTEN_KEY_TTL_MS) written.length = 0;
    const landed = written.findIndex((entry) => entry.key === urlFilterKey);
    if (landed >= 0) {
      // URL do chính trang ghi (có thể là bản cũ): bỏ qua, và bỏ luôn các lần ghi cũ hơn đã bị gộp/vượt qua.
      written.splice(0, landed + 1);
      return;
    }
    written.length = 0;
    setFilters((f) => (courseFilterKey(f) === urlFilterKey ? f : parseCourseFilterParams(new URLSearchParams(urlFilterKey))));
    setVisibleCount(PAGE_SIZE);
  }, [urlFilterKey]);

  /** Ghi bộ lọc lên URL (replace), giữ nguyên `q` trừ khi `dropQuery`. Ghi nhớ khoá đã ghi cho effect đồng bộ. */
  const writeFiltersToUrl = (next: CourseFilters, dropQuery: boolean) => {
    const base = new URLSearchParams(searchParams.toString());
    if (dropQuery) queryDroppedRef.current = true;
    if (queryDroppedRef.current) base.delete("q");
    const key = courseFilterKey(next);
    const written = writtenKeysRef.current;
    if (key !== urlFilterKey && written[written.length - 1]?.key !== key) written.push({ key, at: Date.now() });
    const params = applyCourseFiltersToParams(base, next).toString();
    router.replace(params ? `/courses?${params}` : "/courses", { scroll: false });
  };

  /** Đổi bộ lọc: cập nhật state NGAY (không đợi router) rồi ghi lên URL, giữ nguyên `q`. */
  const commitFilters = (next: CourseFilters, { dropQuery = false } = {}) => {
    setFilters(next);
    setVisibleCount(PAGE_SIZE);
    writeFiltersToUrl(next, dropQuery);
  };

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

  const visibleCourses = allCourses.slice(0, visibleCount);
  const hasMore = allCourses.length > visibleCount;
  const isLoading = coursesLoading || categoriesLoading;
  const hasActiveFilters = Boolean(
    searchQuery ||
      filters.category ||
      filters.levels?.length ||
      filters.priceMin !== undefined ||
      filters.priceMax !== undefined
  );

  const handleFilterChange = (newFilters: CourseFilters) => commitFilters(newFilters);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setVisibleCount(PAGE_SIZE);
    // Xoá ô tìm kiếm thì bỏ luôn `?q=` cũ, nếu không chọn chip rồi tải lại sẽ hiện lại từ khoá đã xoá (Q6-PG-11, L3).
    // Ghi theo state `filters` (không theo `searchParams` có thể cũ hơn) để không đè lên một lần đổi bộ lọc chưa hạ cánh.
    if (!query && searchParams.has("q")) writeFiltersToUrl(filters, true);
  };

  const clearAll = () => {
    setSearchQuery("");
    commitFilters({ sortBy: filters.sortBy }, { dropQuery: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container space-y-8 py-6 md:space-y-10 lg:py-8 xl:space-y-12">
        {/* Header: tiêu đề + tìm kiếm */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-h1 text-slate-900 dark:text-slate-50">Khám phá khoá học</h1>
            <p className="text-body mt-2 text-slate-600 dark:text-slate-400">
              Cập nhật liên tục
            </p>
          </div>
          <div className="w-full md:w-[22rem] md:shrink-0">
            <CourseSearch
              onSearch={handleSearch}
              suggestions={suggestions}
              suggestionsQuery={debouncedSearchQuery}
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
              {allCourses.length} khoá học
              {searchQuery && ` cho "${searchQuery}"`}
            </p>
          )}

          <CourseGrid
            courses={visibleCourses}
            loading={isLoading}
            staggered
            showWishlist
            emptyAction={
              hasActiveFilters ? (
                <Button type="button" variant="outline" onClick={clearAll}>
                  Xoá bộ lọc
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
                Tải thêm khoá học
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
