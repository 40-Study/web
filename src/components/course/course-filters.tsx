"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Category, CourseFilters } from "@/types/course";
import { PriceRangeSlider } from "./price-range-slider";

// Maximum course price for the slider range (VND)
const PRICE_SLIDER_MAX = 2_000_000;

interface CourseFiltersProps {
  categories: Category[];
  filters: CourseFilters;
  onFilterChange: (filters: CourseFilters) => void;
  className?: string;
}

const LEVELS = [
  { value: "beginner", label: "Cơ bản" },
  { value: "intermediate", label: "Trung cấp" },
  { value: "advanced", label: "Nâng cao" },
];

const SORT_OPTIONS = [
  { value: "popular", label: "Phổ biến nhất" },
  { value: "newest", label: "Mới nhất" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "price-low", label: "Giá thấp đến cao" },
  { value: "price-high", label: "Giá cao đến thấp" },
];

export function CourseFiltersComponent({
  categories,
  filters,
  onFilterChange,
  className,
}: CourseFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasPriceFilter =
    (filters.priceMin !== undefined && filters.priceMin > 0) ||
    (filters.priceMax !== undefined && filters.priceMax < PRICE_SLIDER_MAX);

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.levels?.length || 0) +
    (hasPriceFilter ? 1 : 0);

  const handleCategoryChange = (categorySlug: string | undefined) => {
    onFilterChange({ ...filters, category: categorySlug });
  };

  const handleLevelToggle = (level: string) => {
    const currentLevels = filters.levels || [];
    const newLevels = currentLevels.includes(level)
      ? currentLevels.filter((l) => l !== level)
      : [...currentLevels, level];
    onFilterChange({ ...filters, levels: newLevels.length > 0 ? newLevels : undefined });
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    onFilterChange({
      ...filters,
      priceMin: range[0] > 0 ? range[0] : undefined,
      priceMax: range[1] < PRICE_SLIDER_MAX ? range[1] : undefined,
      // Keep legacy priceRange for backward compat: free if max=0
      priceRange: range[1] === 0 ? "free" : undefined,
    });
  };

  const handleSortChange = (sortBy: CourseFilters["sortBy"]) => {
    onFilterChange({ ...filters, sortBy });
  };

  const clearFilters = () => {
    onFilterChange({ sortBy: filters.sortBy });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Category chips: cuộn ngang ở 390 (fade mép), nút Bộ lọc cố định bên phải */}
      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
        <div
          role="group"
          aria-label="Danh mục khóa học"
          className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 pr-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Button
            type="button"
            size="sm"
            variant={!filters.category ? "secondary" : "outline"}
            aria-pressed={!filters.category}
            onClick={() => handleCategoryChange(undefined)}
            className="shrink-0 rounded-pill"
          >
            Tất cả
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              type="button"
              size="sm"
              variant={filters.category === cat.slug ? "secondary" : "outline"}
              aria-pressed={filters.category === cat.slug}
              onClick={() => handleCategoryChange(cat.slug)}
              className="shrink-0 rounded-pill"
            >
              {cat.name}
            </Button>
          ))}
        </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
          />
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-expanded={showFilters}
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0 gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="min-w-[20px] rounded-full bg-primary-600 px-1.5 py-0.5 text-center text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="p-4 md:p-5 border border-slate-200 rounded-2xl bg-white shadow-card space-y-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="text-h4">Bộ lọc nâng cao</h3>
            {activeFilterCount > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" aria-hidden="true" />
                Xóa bộ lọc
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Level Filter */}
            <div>
              <p className="text-label mb-2">Trình độ</p>
              <div className="space-y-2">
                {LEVELS.map((level) => (
                  <label
                    key={level.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.levels?.includes(level.value) || false}
                      onChange={() => handleLevelToggle(level.value)}
                      className="rounded border-input"
                    />
                    <span className="text-sm">{level.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <p className="text-label mb-3">Khoảng giá</p>
              <PriceRangeSlider
                min={0}
                max={PRICE_SLIDER_MAX}
                step={100_000}
                value={[
                  filters.priceMin ?? 0,
                  filters.priceMax ?? PRICE_SLIDER_MAX,
                ]}
                onChange={handlePriceRangeChange}
              />
            </div>

            {/* Sort Filter */}
            <div>
              <label htmlFor="course-sort" className="text-label mb-2 block">Sắp xếp theo</label>
              <select
                id="course-sort"
                value={filters.sortBy || "popular"}
                onChange={(e) =>
                  handleSortChange(e.target.value as CourseFilters["sortBy"])
                }
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
