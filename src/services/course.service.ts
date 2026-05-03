/**
 * Course service — matches backend POST /courses, GET /courses, etc.
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

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

export interface ApiCourse {
  id: string;
  title: string;
  slug?: string;
  short_description?: string;
  description?: string;
  thumbnail_url?: string;
  preview_video_url?: string;
  price?: number | string;
  discount_price?: number | string;
  discount_expires_at?: string;
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
  target_audience?: string[];
  tag_ids?: string[];
  is_featured?: boolean;
  is_free?: boolean;
  status?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  // Enrollment-specific fields (when fetched via /enrollments)
  progress_percentage?: string;
  enrolled_at?: string;
  last_accessed_at?: string;
  completed_lessons?: number;
}

export interface CourseListParams {
  keyword?: string;
  category_id?: string;
  instructor_id?: string;
  level?: string;
  status?: string;
  is_free?: boolean;
  is_featured?: boolean;
  min_price?: number;
  max_price?: number;
  page?: number;
  page_size?: number;
}

export interface CreateCourseDTO {
  instructor_id?: string;
  category_id?: string | null;
  title: string;
  short_description?: string;
  description?: string;
  thumbnail_url?: string | null;
  preview_video_url?: string | null;
  level?: string;
  language?: string;
  price?: number;
  discount_price?: number | null;
  discount_expires_at?: string | null;
  requirements?: string[];
  objectives?: string[];
  target_audience?: string[];
  is_free?: boolean;
  tag_ids?: string[];
}

export interface UpdateCourseDTO {
  title?: string;
  short_description?: string;
  description?: string;
  thumbnail_url?: string | null;
  preview_video_url?: string | null;
  level?: string;
  language?: string;
  price?: number;
  discount_price?: number | null;
  discount_expires_at?: string | null;
  requirements?: string[];
  objectives?: string[];
  target_audience?: string[];
  is_free?: boolean;
  is_featured?: boolean;
  status?: string;
  tag_ids?: string[];
  category_id?: string | null;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const courseService = {
  /** GET /courses — list courses with filters (public) */
  getCourses: (params?: CourseListParams) =>
    api
      .get<{ message: string; data: { courses: ApiCourse[]; total: number } }>("/courses", { params })
      .then((r) => r.data.data),

  /** GET /courses/:id — single course (public) */
  getCourseById: (id: string) =>
    api.get<{ message: string; data: ApiCourse }>(`/courses/${id}`).then((r) => r.data.data),

  /** POST /courses — create course (auth) */
  createCourse: (data: CreateCourseDTO) =>
    api.post<{ message: string; data: ApiCourse }>("/courses", data).then((r) => r.data.data),

  /** PUT /courses/:id — update course (auth) */
  updateCourse: (id: string, data: UpdateCourseDTO) =>
    api.put<{ message: string; data: ApiCourse }>(`/courses/${id}`, data).then((r) => r.data.data),

  /** DELETE /courses/:id — delete course (auth) */
  deleteCourse: (id: string) =>
    api.delete<{ message: string }>(`/courses/${id}`).then((r) => r.data),

  /** GET /courses with keyword — search */
  searchCourses: (keyword: string, limit = 10) =>
    api
      .get<{ message: string; data: { courses: ApiCourse[]; total: number } }>("/courses", {
        params: { keyword, page_size: limit },
      })
      .then((r) => r.data.data.courses),

  /** GET /courses/slug/:slug — get course by slug */
  getCourseBySlug: (slug: string) =>
    api.get<{ message: string; data: ApiCourse }>(`/courses/slug/${slug}`).then((r) => r.data.data),

  /** GET /courses — teacher's own courses (filtered by current user) */
  getMyCourses: (params?: { status?: string }) =>
    api
      .get<{ message: string; data: { courses: ApiCourse[]; total: number } }>("/courses", {
        params: { ...params, mine: true, page_size: 100 },
      })
      .then((r) => r.data.data.courses),

  /** GET /enrollments — enrolled courses for current user */
  getEnrolledCourses: () =>
    api
      .get<{
        message: string;
        data: {
          enrollments: Array<{
            id: string;
            user_id: string;
            course_id: string;
            course_title: string;
            course_slug: string;
            course_thumbnail?: string;
            course_category?: string;
            progress_percentage: string;
            enrolled_at: string;
            completed_at?: string;
            last_accessed_at?: string;
            total_lessons: number;
            completed_lessons: number;
          }>;
          total: number;
        };
      }>("/enrollments")
      .then((r) =>
        (r.data.data.enrollments ?? []).map((e): ApiCourse => ({
          id: e.course_id,
          title: e.course_title,
          slug: e.course_slug,
          thumbnail_url: e.course_thumbnail,
          category: e.course_category ? { id: "", name: e.course_category } : undefined,
          progress_percentage: e.progress_percentage,
          enrolled_at: e.enrolled_at,
          last_accessed_at: e.last_accessed_at,
          total_lessons: e.total_lessons,
          completed_lessons: e.completed_lessons,
          // Defaults for required ApiCourse fields
          price: "0",
          level: "beginner",
          status: "published",
        }))
      ),

  /** POST /courses/:courseId/enroll — enroll in a course */
  enroll: (courseId: string) =>
    api.post<{ message: string }>(`/courses/${courseId}/enroll`).then((r) => r.data),

  /** GET /courses featured */
  getFeaturedCourses: () =>
    api
      .get<{ message: string; data: { courses: ApiCourse[]; total: number } }>("/courses", {
        params: { is_featured: true, page_size: 6 },
      })
      .then((r) => r.data.data.courses),
};
