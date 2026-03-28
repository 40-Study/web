"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
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
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
          <Button
            variant={!filters.category ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(undefined)}
          >
            Tất cả
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={filters.category === cat.slug ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(cat.slug)}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Filter Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="ml-auto"
        >
          <Filter className="h-4 w-4 mr-2" />
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Bộ lọc nâng cao</h3>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Xóa bộ lọc
              </Button>
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
