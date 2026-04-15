import { api } from "@/lib/api-client";

// Types
export interface ChildOverview {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  email: string;
  relationship: string;
  total_xp: number;
  current_streak: number;
  enrolled_courses: number;
  completed_courses: number;
  total_study_minutes: number;
  can_view_progress: boolean;
  can_view_grades: boolean;
  can_view_attendance: boolean;
}

export interface ChildCourse {
  id: string;
  course_id: string;
  course_name: string;
  course_thumbnail?: string;
  instructor_name: string;
  progress_percent: number;
  last_accessed_at?: string;
  completed_at?: string;
  enrolled_at: string;
}

export interface ChildCoursesResponse {
  courses: ChildCourse[];
  total: number;
  page: number;
  page_size: number;
}

export interface ChildGrade {
  id: string;
  class_id: string;
  class_name: string;
  grade_type: string;
  title: string;
  score: number;
  max_score: number;
  percentage: number;
  weight: number;
  graded_at: string;
}

export interface ChildFinalGrade {
  class_id: string;
  class_name: string;
  weighted_average: number;
  letter_grade: string;
  gpa: number;
  rank?: number;
  status: string;
}

export interface ChildGradesResponse {
  grades: ChildGrade[];
  final_grades: ChildFinalGrade[];
}

export interface ChildScheduleItem {
  class_id: string;
  class_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
}

export interface ChildUpcomingSession {
  id: string;
  class_id: string;
  class_name: string;
  session_number: number;
  topic?: string;
  date: string;
  start_time: string;
  end_time: string;
  room?: string;
}

export interface ChildScheduleResponse {
  weekly_schedule: ChildScheduleItem[];
  upcoming_sessions: ChildUpcomingSession[];
}

export interface ChildAttendance {
  id: string;
  class_id: string;
  class_name: string;
  session_number: number;
  date: string;
  status: string;
  check_in_time?: string;
  late_minutes: number;
}

export interface AttendanceStats {
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_rate: number;
}

export interface ChildAttendanceResponse {
  records: ChildAttendance[];
  stats: AttendanceStats;
  total: number;
  page: number;
  page_size: number;
}

export interface ChildAssignment {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  class_name?: string;
  due_date?: string;
  status: string;
  best_verdict?: string;
  test_cases_passed: number;
  total_test_cases: number;
  submission_count: number;
  last_submitted_at?: string;
}

export interface AssignmentStats {
  total_assignments: number;
  completed: number;
  in_progress: number;
  not_started: number;
  overdue: number;
}

export interface ChildAssignmentsResponse {
  assignments: ChildAssignment[];
  stats: AssignmentStats;
  total: number;
  page: number;
  page_size: number;
}

export interface TimetableEntry {
  schedule_id?: string;
  session_id?: string;
  class_id: string;
  class_name: string;
  day_of_week: number;
  date?: string;
  start_time: string;
  end_time: string;
  room?: string;
  topic?: string;
  status: string;
}

export interface TimetableResponse {
  entries: TimetableEntry[];
  week?: string;
}

// API functions
export const parentDashboardService = {
  getChildOverview: (childId: string) =>
    api
      .get<{ message: string; data: ChildOverview }>(`/parent/children/${childId}/overview`)
      .then((r) => r.data.data),

  getChildCourses: (childId: string, page = 1, pageSize = 20) =>
    api
      .get<{ message: string; data: ChildCoursesResponse }>(
        `/parent/children/${childId}/courses`,
        { params: { page, page_size: pageSize } }
      )
      .then((r) => r.data.data),

  getChildGrades: (childId: string) =>
    api
      .get<{ message: string; data: ChildGradesResponse }>(`/parent/children/${childId}/grades`)
      .then((r) => r.data.data),

  getChildSchedule: (childId: string) =>
    api
      .get<{ message: string; data: ChildScheduleResponse }>(`/parent/children/${childId}/schedule`)
      .then((r) => r.data.data),

  getChildTimetable: (childId: string) =>
    api
      .get<{ message: string; data: TimetableResponse }>(`/parent/children/${childId}/timetable`)
      .then((r) => r.data.data),

  getChildAttendance: (childId: string, page = 1, pageSize = 20) =>
    api
      .get<{ message: string; data: ChildAttendanceResponse }>(
        `/parent/children/${childId}/attendance`,
        { params: { page, page_size: pageSize } }
      )
      .then((r) => r.data.data),

  getChildAssignments: (childId: string, page = 1, pageSize = 20) =>
    api
      .get<{ message: string; data: ChildAssignmentsResponse }>(
        `/parent/children/${childId}/assignments`,
        { params: { page, page_size: pageSize } }
      )
      .then((r) => r.data.data),
};
