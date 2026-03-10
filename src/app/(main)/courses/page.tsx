"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CourseGrid } from "@/components/course/course-grid";
import { CourseFiltersComponent } from "@/components/course/course-filters";
import { CourseSearch } from "@/components/course/course-search";
import { useCourses, useCategories, useSearchSuggestions } from "@/hooks/use-courses";
import { CourseFilters } from "@/types/course";

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [filters, setFilters] = useState<CourseFilters>({});
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: courses = [], isLoading: coursesLoading } = useCourses(filters);
  const { data: suggestions = [] } = useSearchSuggestions(searchQuery);

  // Filter courses by search query
  const filteredCourses = searchQuery
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : courses;

  const handleFilterChange = (newFilters: CourseFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Khám phá khóa học</h1>
        <p className="text-muted-foreground">
          Tìm kiếm và học những khóa học phù hợp với bạn
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 max-w-2xl">
        <CourseSearch
          onSearch={handleSearch}
          suggestions={suggestions}
          placeholder="Tìm kiếm khóa học, giảng viên..."
        />
      </div>

      {/* Filters */}
      <CourseFiltersComponent
        categories={categories}
        filters={filters}
        onFilterChange={handleFilterChange}
        className="mb-8"
      />

      {/* Results Count */}
      {!coursesLoading && (
        <p className="text-sm text-muted-foreground mb-4">
          {filteredCourses.length} khóa học
          {searchQuery && ` cho "${searchQuery}"`}
        </p>
      )}

      {/* Course Grid */}
      <CourseGrid
        courses={filteredCourses}
        loading={coursesLoading || categoriesLoading}
      />

      {/* Load More (for future pagination) */}
      {filteredCourses.length > 0 && filteredCourses.length >= 12 && (
        <div className="mt-8 text-center">
          <button className="px-6 py-2 border rounded-lg hover:bg-muted transition-colors">
            Xem thêm khóa học
          </button>
        </div>
      )}
    </div>
  );
}
