"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  courseService,
  ApiCourse,
  ApiCategory,
} from "@/services/course.service";
import { categoryService } from "@/services/category.service";
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
    description: c.short_description || c.description || "",
    thumbnail: c.thumbnail_url ?? "",
    price: Number(c.price) || 0,
    originalPrice: c.discount_price ? Number(c.discount_price) : undefined,
    rating: Number(c.average_rating) || 0,
    reviewCount: c.total_reviews ?? 0,
    studentCount: c.total_students ?? 0,
    instructor: c.instructor
      ? mapApiInstructor(c.instructor)
      : { id: c.instructor_id ?? "", name: "Chưa cập nhật" },
    category: c.category
      ? mapApiCategory(c.category)
      : { id: c.category_id ?? "", name: "Chưa phân loại", slug: "uncategorized" },
    level: (c.level as Course["level"]) ?? "beginner",
    language: c.language === "vi" ? "Tiếng Việt" : (c.language ?? "Tiếng Việt"),
    duration: c.total_duration_minutes ?? 0,
    lessonCount: c.total_lessons ?? 0,
    learningOutcomes: c.objectives ?? [],
    requirements: c.requirements,
    isFeatured: c.is_featured,
    isPublished: c.status === "published",
    createdAt: c.created_at ?? "",
    updatedAt: c.updated_at ?? "",
  };
}

interface ApiSectionRaw {
  id: string;
  title: string;
  display_order?: number;
  lessons?: Array<{
    id: string;
    title: string;
    duration_minutes?: number;
    is_preview?: boolean;
    display_order?: number;
  }>;
}

function mapApiCourseDetail(c: ApiCourse): CourseDetail {
  const apiSections: ApiSectionRaw[] =
    (c as ApiCourse & { sections?: ApiSectionRaw[] }).sections ?? [];
  return {
    ...mapApiCourse(c),
    sections: apiSections.map((s, si) => ({
      id: s.id,
      title: s.title,
      order: s.display_order ?? si + 1,
      duration: (s.lessons ?? []).reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0),
      lessons: (s.lessons ?? []).map((l, li) => ({
        id: l.id,
        title: l.title,
        duration: l.duration_minutes ?? 0,
        type: "video" as const,
        isFreePreview: l.is_preview ?? false,
        order: l.display_order ?? li + 1,
      })),
    })),
    reviews: [],
    ratingDistribution: {},
    previewVideoUrl: undefined,
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
      const mapped = raw.courses.map(mapApiCourse);
      return applyFilters(mapped, filters);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch single course detail by ID
 * @deprecated Use useCourseBySlug for slug-based lookup
 */
export function useCourseDetail(id: string) {
  return useQuery({
    queryKey: [...courseKeys.all, "detail-by-id", id] as const,
    queryFn: async (): Promise<CourseDetail | null> => {
      try {
        const raw = await courseService.getCourseById(id);
        return mapApiCourseDetail(raw);
      } catch (error: unknown) {
        console.error("Failed to fetch course by ID:", error);
        return null;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch all categories */
export function useCategories() {
  return useQuery({
    queryKey: courseKeys.categories(),
    queryFn: async (): Promise<Category[]> => {
      const raw = await categoryService.getAll();
      return raw.map((c): Category => ({
        id: c.id,
        name: c.name,
        slug: c.name.toLowerCase().replace(/\s+/g, "-"),
        icon: c.icon_url ?? undefined,
      }));
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
          thumbnail: c.thumbnail_url ?? "",
          instructor: c.instructor?.name ?? "Chưa cập nhật",
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
      return raw.map((c): EnrolledCourse => ({
        ...mapApiCourse(c),
        progress: c.progress_percentage ? parseFloat(c.progress_percentage) : 0,
        completedLessons: 0,
        totalLessons: c.total_lessons ?? 0,
        enrolledAt: c.enrolled_at ?? c.created_at ?? "",
        lastAccessedAt: c.last_accessed_at,
      }));
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

/** Fetch course by slug — tries slug first, falls back to ID lookup */
export function useCourseBySlug(slug: string) {
  return useQuery({
    queryKey: courseKeys.detail(slug),
    queryFn: async (): Promise<CourseDetail> => {
      try {
        const raw = await courseService.getCourseBySlug(slug);
        return mapApiCourseDetail(raw);
      } catch {
        // Slug endpoint may not exist yet — try by ID as fallback
        const byId = await courseService.getCourseById(slug);
        return mapApiCourseDetail(byId);
      }
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

/** Enroll in a course */
export function useEnrollCourse() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => courseService.enroll(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.enrolled() });
      toast.success("Đăng ký khóa học thành công!");
    },
    onError: (error: unknown) => {
      console.error("Enrollment failed:", error);
      toast.error("Đăng ký thất bại", {
        description: "Vui lòng thử lại sau",
      });
    },
  });
}

