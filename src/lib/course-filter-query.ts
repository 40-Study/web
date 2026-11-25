/**
 * Bộ lọc khoá học <-> query string của /courses (Q6-PG-11): chọn chip/bộ lọc xong tải lại hay chia sẻ link vẫn
 * giữ nguyên. Chỉ đụng các khoá của bộ lọc; `q` (từ khoá) do CourseSearch quản lý và được giữ nguyên.
 */
import type { CourseFilters } from "@/types/course";

export const COURSE_FILTER_PARAM_KEYS = ["category", "levels", "priceMin", "priceMax", "sort"] as const;

const SORT_VALUES: readonly NonNullable<CourseFilters["sortBy"]>[] = ["popular", "newest", "rating", "price-low", "price-high"];

function parseNonNegative(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Đọc bộ lọc từ URL; giá trị rác (sort lạ, giá âm/NaN) bị bỏ qua, không kẹt bộ lọc. */
export function parseCourseFilterParams(params: { get(name: string): string | null }): CourseFilters {
  const filters: CourseFilters = {};
  const category = params.get("category");
  if (category) filters.category = category;
  const levels = (params.get("levels") ?? "").split(",").map(level => level.trim()).filter(Boolean);
  if (levels.length > 0) filters.levels = levels;
  const priceMin = parseNonNegative(params.get("priceMin"));
  if (priceMin !== undefined) filters.priceMin = priceMin;
  const priceMax = parseNonNegative(params.get("priceMax"));
  if (priceMax !== undefined) filters.priceMax = priceMax;
  const sort = params.get("sort");
  const sortBy = SORT_VALUES.find(value => value === sort);
  if (sortBy) filters.sortBy = sortBy;
  return filters;
}

/** Ghi bộ lọc vào bản sao của `base` (giữ mọi khoá khác như `q`), xoá khoá của bộ lọc rỗng. */
export function applyCourseFiltersToParams(base: URLSearchParams, filters: CourseFilters): URLSearchParams {
  const next = new URLSearchParams(base.toString());
  for (const key of COURSE_FILTER_PARAM_KEYS) next.delete(key);
  if (filters.category) next.set("category", filters.category);
  if (filters.levels?.length) next.set("levels", filters.levels.join(","));
  if (filters.priceMin !== undefined) next.set("priceMin", String(filters.priceMin));
  if (filters.priceMax !== undefined) next.set("priceMax", String(filters.priceMax));
  if (filters.sortBy) next.set("sort", filters.sortBy);
  return next;
}

/** Chuỗi so sánh hai bộ lọc có cùng nội dung không (bỏ qua thứ tự khoá). */
export function courseFilterKey(filters: CourseFilters): string {
  return applyCourseFiltersToParams(new URLSearchParams(), filters).toString();
}
