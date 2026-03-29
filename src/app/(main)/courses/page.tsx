"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, BookOpen, TrendingUp } from "lucide-react";
import { CourseGrid } from "@/components/course/course-grid";
import { CourseFiltersComponent } from "@/components/course/course-filters";
import { CourseSearch } from "@/components/course/course-search";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
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
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite]" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-secondary-500/15 rounded-full blur-3xl animate-[float_12s_ease-in-out_infinite_2s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-14 md:py-20">
          <ScrollReveal direction="fade">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-300" />
              </div>
              <span className="text-sm font-medium text-primary-300 tracking-wide uppercase">Khám phá & Học tập</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
              Khám phá khóa học
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="text-slate-400 text-lg max-w-xl mb-8">
              Tìm kiếm và học những khóa học phù hợp với mục tiêu phát triển của bạn
            </p>
          </ScrollReveal>

          {/* Search Bar */}
          <ScrollReveal delay={300}>
            <div className="max-w-2xl">
              <CourseSearch
                onSearch={handleSearch}
                suggestions={suggestions}
                placeholder="Tìm kiếm khóa học, giảng viên..."
              />
            </div>
          </ScrollReveal>

          {/* Quick stats */}
          <ScrollReveal delay={400}>
            <div className="flex flex-wrap gap-6 mt-8">
              <div className="flex items-center gap-2 text-slate-400">
                <BookOpen className="w-4 h-4 text-primary-400" />
                <span className="text-sm">{mockCourses.length}+ khóa học</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm">Cập nhật liên tục</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
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
