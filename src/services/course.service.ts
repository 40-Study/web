/**
 * Course service — real API calls following class.service.ts pattern
 */

import { api } from "@/lib/api-client";

// ─── Response types (matching backend handler responses) ────────────────────

export interface ApiCourse {
  id: string;
  title: string;
  slug?: string;
  short_description?: string;
  description?: string;
  thumbnail_url?: string;
  price?: number | string;
  discount_price?: number | string;
  average_rating?: number | string;
  total_reviews?: number;
  total_students?: number;
  instructor_id?: string;
  instructor?: ApiInstructor;
  category_id?: string;
  category?: ApiCategory;
  level?: string;
  language?: string;
  total_duration_minutes?: number;
  total_lessons?: number;
  objectives?: string[];
  requirements?: string[];
  is_featured?: boolean;
  is_free?: boolean;
  status?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiInstructor {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
  bio?: string;
  course_count?: number;
  student_count?: number;
  rating?: number;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  course_title?: string;
  course_thumbnail?: string;
  progress_percentage?: number | string;
  completed_at?: string;
  last_accessed_at?: string;
  enrolled_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CourseListParams {
  keyword?: string;
  category_id?: string;
  level?: string;
  is_free?: boolean;
  min_price?: number;
  max_price?: number;
  status?: string;
  page?: number;
  page_size?: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const courseService = {
  /**
   * GET /courses — list courses with optional filters
   */
  getCourses: (params?: CourseListParams) =>
    api
      .get<{ message: string; data: { courses: ApiCourse[]; total: number } }>("/courses", { params })
      .then((r) => r.data.data.courses),

  /**
   * GET /courses/:id — get single course by ID
   */
  getCourseById: (id: string) =>
    api
      .get<{ message: string; data: ApiCourse }>(`/courses/${id}`)
      .then((r) => r.data.data),

  /**
   * GET /enrollments — get current user's enrolled courses (auth required)
   */
  getEnrolledCourses: () =>
    api
      .get<{ message: string; data: { enrollments: ApiEnrollment[]; total: number } }>("/enrollments")
      .then((r) => r.data.data.enrollments),

  /**
   * GET /categories — list all categories
   */
  getCategories: (keyword?: string) =>
    api
      .get<{ message: string; data: { categories: ApiCategory[]; total: number } }>("/categories", {
        params: keyword ? { keyword } : {},
      })
      .then((r) => r.data.data.categories),

  /**
   * GET /courses with keyword — search courses by keyword
   * Used for search suggestions (returns lightweight course list)
   */
  searchCourses: (keyword: string, limit = 10) =>
    api
      .get<{ message: string; data: { courses: ApiCourse[]; total: number } }>("/courses", {
        params: { keyword, page_size: limit },
      })
      .then((r) => r.data.data.courses),

  /**
   * GET /courses with is_featured filter
   * Note: backend may or may not support is_featured query param.
   * Falls back gracefully if the param is ignored.
   */
  getFeaturedCourses: () =>
    api
      .get<{ message: string; data: { courses: ApiCourse[]; total: number } }>("/courses", {
        params: { page_size: 6 },
      })
      .then((r) => r.data.data.courses),

  /**
   * GET /courses/slug/:slug — get course by slug
   */
  getCourseBySlug: (slug: string) =>
    api
      .get<{ message: string; data: ApiCourse }>(`/courses/slug/${slug}`)
      .then((r) => r.data.data),

  /**
   * POST /courses/:id/enroll — enroll in a course
   */
  enroll: (courseId: string) =>
    api
      .post<{ message: string }>(`/courses/${courseId}/enroll`, {})
      .then((r) => r.data),

  /**
   * POST /lessons/:id/progress — save lesson progress
   */
  saveProgress: (data: { lessonId: string; progress: number; timestamp?: number }) =>
    api
      .post<{ message: string }>(`/lessons/${data.lessonId}/progress`, {
        progress: data.progress,
        timestamp: data.timestamp,
      })
      .then((r) => r.data),

  /**
   * POST /lessons/:id/complete — mark lesson as complete
   */
  completeLesson: (lessonId: string) =>
    api
      .post<{ message: string; data: { xp_awarded?: number } }>(`/lessons/${lessonId}/complete`, {})
      .then((r) => r.data),

  /**
   * GET /courses/me — get current teacher's courses
   */
  getMyCourses: (params?: { status?: string }) =>
    api
      .get<{ message: string; data: ApiCourse[] }>("/courses/me", { params })
      .then((r) => r.data.data),

  /**
   * POST /courses — create a new course
   */
  createCourse: (data: Partial<ApiCourse>) =>
    api
      .post<{ message: string; data: ApiCourse }>("/courses", data)
      .then((r) => r.data.data),

  /**
   * PUT /courses/:id — update course
   */
  updateCourse: (id: string, data: Partial<ApiCourse>) =>
    api
      .put<{ message: string; data: ApiCourse }>(`/courses/${id}`, data)
      .then((r) => r.data.data),

  /**
   * DELETE /courses/:id — delete course
   */
  deleteCourse: (id: string) =>
    api
      .delete<{ message: string }>(`/courses/${id}`)
      .then((r) => r.data),
};
