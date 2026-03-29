"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
          <button
            onClick={() => handleCategoryChange(undefined)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
              !filters.category
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                filters.category === cat.slug
                  ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-primary-200 hover:text-primary-700 hover:bg-primary-50/50"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
            showFilters
              ? "bg-primary-50 text-primary-700 border-primary-200"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
          )}
        >
          <Filter className="h-4 w-4" />
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="p-5 border border-slate-200/60 rounded-2xl bg-white shadow-sm shadow-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Bộ lọc nâng cao</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-rose-600 transition-colors"
              >
                <X className="h-4 w-4" />
                Xóa bộ lọc
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Level Filter */}
            <div>
              <p className="text-sm font-medium mb-2">Trình độ</p>
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
              <p className="text-sm font-medium mb-3">Khoảng giá</p>
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
              <p className="text-sm font-medium mb-2">Sắp xếp theo</p>
              <select
                value={filters.sortBy || "popular"}
                onChange={(e) =>
                  handleSortChange(e.target.value as CourseFilters["sortBy"])
                }
                className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm"
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
