"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Category, CourseFilters } from "@/types/course";

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

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.levels?.length || 0) +
    (filters.priceRange && filters.priceRange !== "all" ? 1 : 0);

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

  const handlePriceChange = (priceRange: "free" | "paid" | "all") => {
    onFilterChange({
      ...filters,
      priceRange: priceRange === "all" ? undefined : priceRange,
    });
  };

  const handleSortChange = (sortBy: CourseFilters["sortBy"]) => {
    onFilterChange({ ...filters, sortBy });
  };

  const clearFilters = () => {
    onFilterChange({});
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
        <div className="p-4 border rounded-lg bg-card space-y-4">
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

            {/* Price Filter */}
            <div>
              <p className="text-sm font-medium mb-2">Giá</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={!filters.priceRange || filters.priceRange === "all"}
                    onChange={() => handlePriceChange("all")}
                    className="border-input"
                  />
                  <span className="text-sm">Tất cả</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={filters.priceRange === "free"}
                    onChange={() => handlePriceChange("free")}
                    className="border-input"
                  />
                  <span className="text-sm">Miễn phí</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={filters.priceRange === "paid"}
                    onChange={() => handlePriceChange("paid")}
                    className="border-input"
                  />
                  <span className="text-sm">Có phí</span>
                </label>
              </div>
            </div>

            {/* Sort Filter */}
            <div>
              <p className="text-sm font-medium mb-2">Sắp xếp theo</p>
              <select
                value={filters.sortBy || "popular"}
                onChange={(e) =>
                  handleSortChange(e.target.value as CourseFilters["sortBy"])
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
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
