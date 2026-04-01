/**
 * Enrollment service - handles course enrollment and progress tracking
 */

import { api } from "@/lib/api-client";

export interface Enrollment {
  id: string;
  course_id: string;
  user_id: string;
  status: "active" | "completed" | "dropped";
  progress: number; // percentage 0-100
  enrolled_at: string;
  completed_at?: string;
}

export interface EnrollmentProgress {
  enrollment_id: string;
  course_id: string;
  progress: number;
  completed_lessons: string[];
  total_lessons: number;
  last_accessed_at?: string;
}

export interface UpdateProgressDTO {
  completed: boolean;
  time_spent?: number; // seconds
  position?: number;   // video position in seconds
}

type ApiResponse<T> = { message: string; data: T };

export const enrollmentService = {
  /** GET /enrollments/me - get current user's enrollments */
  getMyEnrollments: () =>
    api
      .get<ApiResponse<{ enrollments: Enrollment[] }>>("/enrollments/me")
      .then((r) => r.data.data.enrollments),

  /** GET /enrollments/course/:courseId - get all enrollments for a course */
  getCourseEnrollments: (courseId: string) =>
    api
      .get<ApiResponse<{ enrollments: Enrollment[] }>>(`/enrollments/course/${courseId}`)
      .then((r) => r.data.data.enrollments),

  /** POST /enrollments - enroll current user in a course */
  enroll: (courseId: string) =>
    api
      .post<ApiResponse<Enrollment>>("/enrollments", { course_id: courseId })
      .then((r) => r.data.data),

  /** DELETE /enrollments/:id - unenroll from a course */
  unenroll: (enrollmentId: string) =>
    api
      .delete<ApiResponse<null>>(`/enrollments/${enrollmentId}`)
      .then((r) => r.data),

  /** GET /enrollments/:id/progress - get lesson progress for an enrollment */
  getProgress: (enrollmentId: string) =>
    api
      .get<ApiResponse<EnrollmentProgress>>(`/enrollments/${enrollmentId}/progress`)
      .then((r) => r.data.data),

  /** PUT /enrollments/:id/progress - update progress for a specific lesson */
  updateProgress: (enrollmentId: string, lessonId: string, data: UpdateProgressDTO) =>
    api
      .put<ApiResponse<EnrollmentProgress>>(
        `/enrollments/${enrollmentId}/progress`,
        { lesson_id: lessonId, ...data }
      )
      .then((r) => r.data.data),
};
