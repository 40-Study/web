/**
 * React Query hooks for teacher dashboard
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ─── Query Keys ────────────────────────────────────────────────────────────

export const teacherKeys = {
  all: ["teacher"] as const,
  stats: () => [...teacherKeys.all, "stats"] as const,
  courses: () => [...teacherKeys.all, "courses"] as const,
  activity: () => [...teacherKeys.all, "activity"] as const,
  analytics: () => [...teacherKeys.all, "analytics"] as const,
  assignments: () => [...teacherKeys.all, "assignments"] as const,
  exams: () => [...teacherKeys.all, "exams"] as const,
  students: (classId?: string) => [...teacherKeys.all, "students", classId] as const,
};

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TeacherStats {
  total_students: number;
  total_courses: number;
  total_lessons: number;
  total_revenue: number;
}

export interface TeacherCourse {
  id: string;
  title: string;
  slug: string;
  student_count: number;
  status: string;
}

export interface TeacherActivity {
  id: string;
  type: string;
  message: string;
  created_at: string;
}

export interface TeacherAnalytics {
  enrollment_data: { month: string; count: number }[];
  completion_data: { month: string; rate: number }[];
  distribution_data: { level: string; count: number }[];
  stats: TeacherStats;
}

export interface Assignment {
  id: string;
  title: string;
  course_id: string;
  due_date: string;
  status: string;
  submission_count: number;
}

export interface Exam {
  id: string;
  title: string;
  course_id: string;
  duration: number;
  status: string;
  participant_count: number;
}

// ─── Hooks ─────────────────────────────────────────────────────────────────

/** Fetch teacher dashboard stats */
export function useTeacherStats() {
  return useQuery({
    queryKey: teacherKeys.stats(),
    queryFn: () =>
      apiClient.get<{ message: string; data: TeacherStats }>("/teacher/stats")
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch teacher's courses */
export function useTeacherCourses() {
  return useQuery({
    queryKey: teacherKeys.courses(),
    queryFn: () =>
      apiClient.get<{ message: string; data: TeacherCourse[] }>("/teacher/courses")
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch teacher's recent activity */
export function useTeacherRecentActivity() {
  return useQuery({
    queryKey: teacherKeys.activity(),
    queryFn: () =>
      apiClient.get<{ message: string; data: TeacherActivity[] }>("/teacher/activity")
        .then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

/** Fetch teacher analytics data */
export function useTeacherAnalytics() {
  return useQuery({
    queryKey: teacherKeys.analytics(),
    queryFn: () =>
      apiClient.get<{ message: string; data: TeacherAnalytics }>("/teacher/analytics")
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch teacher's assignments */
export function useTeacherAssignments() {
  return useQuery({
    queryKey: teacherKeys.assignments(),
    queryFn: () =>
      apiClient.get<{ message: string; data: Assignment[] }>("/teacher/assignments")
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch teacher's exams */
export function useTeacherExams() {
  return useQuery({
    queryKey: teacherKeys.exams(),
    queryFn: () =>
      apiClient.get<{ message: string; data: Exam[] }>("/teacher/exams")
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
