"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CourseGrid } from "@/components/course/course-grid";
import { CourseFiltersComponent } from "@/components/course/course-filters";
import { CourseSearch } from "@/components/course/course-search";
import { CourseBannerCarousel } from "@/components/course/course-banner-carousel";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { useCourses, useCategories, useSearchSuggestions } from "@/hooks/use-courses";
import { CourseFilters } from "@/types/course";

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [filters, setFilters] = useState<CourseFilters>({});
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const { data: allCourses = [], isLoading: coursesLoading } = useCourses(filters);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: suggestions = [] } = useSearchSuggestions(searchQuery);

  // Filter courses by search query (API filters handled by useCourses)
  const filteredCourses = searchQuery
    ? allCourses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allCourses;

  const freeCourses = filteredCourses.filter((course) => course.price === 0);
  const paidCourses = filteredCourses.filter((course) => course.price > 0);

  const handleFilterChange = (newFilters: CourseFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 pt-6 pb-8">
        {/* Compact Header: Title + Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <ScrollReveal direction="fade">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Khám phá khóa học</h1>
              <p className="text-slate-500 text-sm mt-1">
                {allCourses.length}+ khóa học &middot; Cập nhật liên tục
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="fade" delay={100}>
            <div className="w-full md:w-80">
              <CourseSearch
                onSearch={handleSearch}
                suggestions={suggestions}
                placeholder="Tìm kiếm khóa học..."
              />
            </div>
          </ScrollReveal>
        </div>

        {/* Banner Carousel */}
        <ScrollReveal direction="scale" className="mb-8">
          <CourseBannerCarousel />
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal direction="fade">
          <CourseFiltersComponent
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterChange}
            className="mb-8"
          />
        </ScrollReveal>

        {/* Results Count */}
        {!coursesLoading && (
          <p className="mb-4 text-sm text-slate-500">
            {filteredCourses.length} khóa học
            {searchQuery && ` cho "${searchQuery}"`}
          </p>
        )}

        {/* Free courses */}
        {freeCourses.length > 0 && (
          <section className="mb-14">
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-green-500" />
                <h2 className="text-xl font-bold text-slate-900">Khóa học miễn phí</h2>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                  {freeCourses.length} khóa học
                </span>
              </div>
            </ScrollReveal>
            <CourseGrid
              courses={freeCourses}
              loading={coursesLoading || categoriesLoading}
              staggered
            />
          </section>
        )}

        {/* Paid courses */}
        {paidCourses.length > 0 && (
          <section className="mb-14">
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-primary-500" />
                <h2 className="text-xl font-bold text-slate-900">Khóa học trả phí</h2>
                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                  {paidCourses.length} khóa học
                </span>
              </div>
            </ScrollReveal>
            <CourseGrid
              courses={paidCourses}
              loading={coursesLoading || categoriesLoading}
              staggered
            />
          </section>
        )}

        {/* Load More */}
        {filteredCourses.length > 0 && filteredCourses.length >= 12 && (
          <ScrollReveal direction="fade">
            <div className="mt-4 text-center">
              <button
                onClick={() => toast.info("Đang tải thêm...")}
                className="px-8 py-3 bg-white border border-slate-200 rounded-2xl hover:border-primary-300 hover:shadow-md hover:shadow-primary-100/50 transition-all duration-300 font-medium text-slate-700 hover:text-primary-700"
              >
                Xem thêm khóa học
              </button>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
