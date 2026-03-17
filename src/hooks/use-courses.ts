"use client";

import { useQuery } from "@tanstack/react-query";
import {
  courseService,
  ApiCourse,
  ApiCategory,
  ApiEnrollment,
} from "@/services/course.service";
import {
  Course,
  CourseDetail,
  CourseFilters,
  Category,
  EnrolledCourse,
  CourseSearchResult,
  Instructor,
} from "@/types/course";

// ─── Mappers: ApiCourse → frontend Course types ───────────────────────────

function mapApiCategory(c: ApiCategory): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug ?? c.name.toLowerCase().replace(/\s+/g, "-"),
    icon: c.icon,
  };
}

function mapApiInstructor(
  api: NonNullable<ApiCourse["instructor"]>
): Instructor {
  return {
    id: api.id,
    name: api.name,
    avatar: api.avatar,
    title: api.title,
    bio: api.bio,
    courseCount: api.course_count,
    studentCount: api.student_count,
    rating: api.rating,
  };
}

function mapApiCourse(c: ApiCourse): Course {
  return {
    id: c.id,
    title: c.title,
    slug: c.slug ?? c.id,
    description: c.description ?? "",
    thumbnail: c.thumbnail ?? "",
    price: c.price ?? 0,
    originalPrice: c.original_price,
    rating: c.rating ?? 0,
    reviewCount: c.review_count ?? 0,
    studentCount: c.student_count ?? 0,
    instructor: c.instructor
      ? mapApiInstructor(c.instructor)
      : { id: c.instructor_id ?? "", name: "Unknown" },
    category: c.category
      ? mapApiCategory(c.category)
      : { id: c.category_id ?? "", name: "Unknown", slug: "unknown" },
    level: (c.level as Course["level"]) ?? "beginner",
    language: c.language ?? "Tiếng Việt",
    duration: c.duration ?? 0,
    lessonCount: c.lesson_count ?? 0,
    learningOutcomes: c.learning_outcomes ?? [],
    requirements: c.requirements,
    isFeatured: c.is_featured,
    isPublished: c.is_published,
    createdAt: c.created_at ?? "",
    updatedAt: c.updated_at ?? "",
  };
}

function mapApiCourseDetail(c: ApiCourse): CourseDetail {
  return {
    ...mapApiCourse(c),
    sections: [],
    reviews: [],
    ratingDistribution: {},
    previewVideoUrl: undefined,
  };
}

function mapApiEnrollment(e: ApiEnrollment): EnrolledCourse {
  const base = e.course ? mapApiCourse(e.course) : ({} as Course);
  return {
    ...base,
    progress: e.progress ?? 0,
    completedLessons: e.completed_lessons ?? 0,
    totalLessons: e.total_lessons ?? 0,
    lastAccessedAt: e.last_accessed_at,
    enrolledAt: e.enrolled_at ?? e.created_at ?? "",
  };
}

// ─── Filter helper (applied client-side on the returned list) ────────────

function applyFilters(courses: Course[], filters: CourseFilters): Course[] {
  let result = [...courses];

  if (filters.category) {
    result = result.filter((c) => c.category.slug === filters.category);
  }

  if (filters.levels && filters.levels.length > 0) {
    result = result.filter((c) => filters.levels!.includes(c.level));
  }

  if (filters.priceRange === "free") {
    result = result.filter((c) => c.price === 0);
  } else if (filters.priceRange === "paid") {
    result = result.filter((c) => c.price > 0);
  }

  if (filters.minRating) {
    result = result.filter((c) => c.rating >= filters.minRating!);
  }

  switch (filters.sortBy) {
    case "newest":
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case "rating":
      result.sort((a, b) => b.rating - a.rating);
      break;
    case "price-low":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      result.sort((a, b) => b.price - a.price);
      break;
    case "popular":
    default:
      result.sort((a, b) => b.studentCount - a.studentCount);
      break;
  }

  return result;
}

// ─── Query key factory ────────────────────────────────────────────────────

export const courseKeys = {
  all: ["courses"] as const,
  list: (filters: CourseFilters) =>
    [...courseKeys.all, "list", filters] as const,
  detail: (slug: string) => [...courseKeys.all, "detail", slug] as const,
  categories: () => ["categories"] as const,
  searchSuggestions: (query: string) =>
    ["search-suggestions", query] as const,
  enrolled: () => ["enrolled-courses"] as const,
  featured: () => [...courseKeys.all, "featured"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────

/** Fetch courses list with optional client-side filters */
export function useCourses(filters: CourseFilters = {}) {
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: async (): Promise<Course[]> => {
      const raw = await courseService.getCourses();
      const mapped = raw.map(mapApiCourse);
      return applyFilters(mapped, filters);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch single course detail by slug or ID */
export function useCourseDetail(slug: string) {
  return useQuery({
    queryKey: courseKeys.detail(slug),
    queryFn: async (): Promise<CourseDetail | null> => {
      try {
        const raw = await courseService.getCourseById(slug);
        return mapApiCourseDetail(raw);
      } catch {
        return null;
      }
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch all categories */
export function useCategories() {
  return useQuery({
    queryKey: courseKeys.categories(),
    queryFn: async (): Promise<Category[]> => {
      const raw = await courseService.getCategories();
      return raw.map(mapApiCategory);
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** Search suggestions — keyword search, min 2 chars */
export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: courseKeys.searchSuggestions(query),
    queryFn: async (): Promise<CourseSearchResult[]> => {
      if (query.length < 2) return [];
      const raw = await courseService.searchCourses(query, 10);
      return raw.map(
        (c): CourseSearchResult => ({
          id: c.id,
          title: c.title,
          thumbnail: c.thumbnail ?? "",
          instructor: c.instructor?.name ?? "Unknown",
          slug: c.slug ?? c.id,
        })
      );
    },
    enabled: query.length >= 2,
    staleTime: 60 * 1000,
  });
}

/** Fetch currently authenticated user's enrolled courses */
export function useEnrolledCourses() {
  return useQuery({
    queryKey: courseKeys.enrolled(),
    queryFn: async (): Promise<EnrolledCourse[]> => {
      const raw = await courseService.getEnrolledCourses();
      return raw.map(mapApiEnrollment);
    },
    staleTime: 60 * 1000,
  });
}

/** Fetch featured courses (first page, client-side filter for isFeatured) */
export function useFeaturedCourses() {
  return useQuery({
    queryKey: courseKeys.featured(),
    queryFn: async (): Promise<Course[]> => {
      const raw = await courseService.getFeaturedCourses();
      return raw.map(mapApiCourse).filter((c) => c.isFeatured);
    },
    staleTime: 5 * 60 * 1000,
  });
}
