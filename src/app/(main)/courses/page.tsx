"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CourseGrid } from "@/components/course/course-grid";
import { CourseFiltersComponent } from "@/components/course/course-filters";
import { CourseSearch } from "@/components/course/course-search";
import { useSearchSuggestions } from "@/hooks/use-courses";
import { CourseFilters } from "@/types/course";
import { mockCourses, mockCategories } from "@/lib/mock-data/courses";

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [filters, setFilters] = useState<CourseFilters>({});
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const categories = mockCategories;
  const coursesLoading = false;
  const categoriesLoading = false;
  const { data: suggestions = [] } = useSearchSuggestions(searchQuery);

  // Filter courses by search query and filters
  const filteredCourses = searchQuery
    ? mockCourses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockCourses;

  const freeCourses = filteredCourses.filter((course) => course.price === 0);
  const paidCourses = filteredCourses.filter((course) => course.price > 0);

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
        <p className="mb-4 text-sm text-muted-foreground">
          {filteredCourses.length} khóa học
          {searchQuery && ` cho "${searchQuery}"`}
        </p>
      )}

      {/* Free courses */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Khóa học miễn phí</h2>
        <CourseGrid
          courses={freeCourses}
          loading={coursesLoading || categoriesLoading}
        />
      </section>

      {/* Paid courses */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Khóa học trả phí</h2>
        <CourseGrid
          courses={paidCourses}
          loading={coursesLoading || categoriesLoading}
        />
      </section>

      {/* Load More */}
      {filteredCourses.length > 0 && filteredCourses.length >= 12 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => toast.info("Đang tải thêm...")}
            className="px-6 py-2 border rounded-lg hover:bg-muted transition-colors"
          >
            Xem thêm khóa học
          </button>
        </div>
      )}
    </div>
  );
}
