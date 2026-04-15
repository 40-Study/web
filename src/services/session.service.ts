/**
 * Session service — class sessions, attendance, timetable
 * Endpoints: /classes/:classId/schedules, /classes/:classId/sessions, /sessions/:id
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

// Class Schedule (recurring)
export interface ClassSchedule {
  id: string;
  class_id: string;
  day_of_week: number; // 0-6, Monday = 1
  start_time: string;
  end_time: string;
  room?: string;
  effective_from?: string;
  effective_until?: string;
  created_at?: string;
}

export interface CreateClassScheduleDTO {
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  effective_from?: string;
  effective_until?: string;
}

export interface UpdateClassScheduleDTO {
  start_time?: string;
  end_time?: string;
  room?: string;
  effective_from?: string;
  effective_until?: string;
}

// Class Session (individual)
export type SessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface ClassSession {
  id: string;
  class_id: string;
  schedule_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  topic?: string;
  notes?: string;
  status: SessionStatus;
  cancel_reason?: string;
  meeting_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateClassSessionDTO {
  date: string;
  start_time: string;
  end_time: string;
  topic?: string;
  notes?: string;
}

export interface UpdateClassSessionDTO {
  topic?: string;
  notes?: string;
  status?: SessionStatus;
}

export interface GenerateSessionsDTO {
  start_date: string;
  end_date: string;
}

// Session Attendance
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface SessionAttendance {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  note?: string;
  check_in_time?: string;
  check_out_time?: string;
  late_minutes?: number;
  student?: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface MarkAttendanceDTO {
  student_id: string;
  status: AttendanceStatus;
  note?: string;
}

export interface BulkAttendanceDTO {
  attendances: MarkAttendanceDTO[];
}

export interface UpdateAttendanceDTO {
  status?: AttendanceStatus;
  note?: string;
  late_minutes?: number;
}

// Timetable
export interface TimetableEntry {
  id: string;
  class_id: string;
  class_name: string;
  course_name?: string;
  date: string;
  start_time: string;
  end_time: string;
  room?: string;
  topic?: string;
  status: SessionStatus;
  teacher_name?: string;
}

export interface TimetableResponse {
  entries: TimetableEntry[];
  week_start: string;
  week_end: string;
}

// Reminder Settings
export interface ReminderSetting {
  event_type: string;
  remind_before_minutes: number[];
  channels: string[];
  is_enabled: boolean;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const sessionService = {
  // ── Class Schedules ───────────────────────────────────────────────────────

  /** POST /classes/:classId/schedules */
  createSchedule: (classId: string, data: CreateClassScheduleDTO) =>
    api.post<R<ClassSchedule>>(`/classes/${classId}/schedules`, data).then((r) => r.data.data),

  /** GET /classes/:classId/schedules */
  getSchedules: (classId: string) =>
    api.get<R<ClassSchedule[]>>(`/classes/${classId}/schedules`).then((r) => r.data.data),

  /** GET /classes/:classId/schedules/:scheduleId */
  getSchedule: (classId: string, scheduleId: string) =>
    api.get<R<ClassSchedule>>(`/classes/${classId}/schedules/${scheduleId}`).then((r) => r.data.data),

  /** PUT /classes/:classId/schedules/:scheduleId */
  updateSchedule: (classId: string, scheduleId: string, data: UpdateClassScheduleDTO) =>
    api
      .put<R<ClassSchedule>>(`/classes/${classId}/schedules/${scheduleId}`, data)
      .then((r) => r.data.data),

  /** DELETE /classes/:classId/schedules/:scheduleId */
  deleteSchedule: (classId: string, scheduleId: string) =>
    api.delete<R<null>>(`/classes/${classId}/schedules/${scheduleId}`).then((r) => r.data),

  /** GET /classes/:classId/timetable */
  getClassTimetable: (classId: string) =>
    api.get<R<TimetableResponse>>(`/classes/${classId}/timetable`).then((r) => r.data.data),

  // ── Class Sessions ────────────────────────────────────────────────────────

  /** POST /classes/:classId/sessions */
  createSession: (classId: string, data: CreateClassSessionDTO) =>
    api.post<R<ClassSession>>(`/classes/${classId}/sessions`, data).then((r) => r.data.data),

  /** POST /classes/:classId/sessions/generate */
  generateSessions: (classId: string, data: GenerateSessionsDTO) =>
    api
      .post<R<ClassSession[]>>(`/classes/${classId}/sessions/generate`, data)
      .then((r) => r.data.data),

  /** GET /classes/:classId/sessions */
  getSessions: (classId: string, params?: { page?: number; page_size?: number }) =>
    api
      .get<R<{ sessions: ClassSession[]; total: number }>>(`/classes/${classId}/sessions`, { params })
      .then((r) => r.data.data),

  /** GET /classes/:classId/sessions/:sessionId */
  getSession: (classId: string, sessionId: string) =>
    api.get<R<ClassSession>>(`/classes/${classId}/sessions/${sessionId}`).then((r) => r.data.data),

  /** PUT /classes/:classId/sessions/:sessionId */
  updateSession: (classId: string, sessionId: string, data: UpdateClassSessionDTO) =>
    api
      .put<R<ClassSession>>(`/classes/${classId}/sessions/${sessionId}`, data)
      .then((r) => r.data.data),

  /** DELETE /classes/:classId/sessions/:sessionId */
  cancelSession: (classId: string, sessionId: string, cancelReason?: string) =>
    api
      .delete<R<null>>(`/classes/${classId}/sessions/${sessionId}`, {
        data: cancelReason ? { cancel_reason: cancelReason } : undefined,
      })
      .then((r) => r.data),

  // ── Session Attendance ────────────────────────────────────────────────────

  /** GET /sessions/:sessionId/attendances */
  getAttendances: (sessionId: string) =>
    api.get<R<SessionAttendance[]>>(`/sessions/${sessionId}/attendances`).then((r) => r.data.data),

  /** POST /sessions/:sessionId/attendances */
  markAttendance: (sessionId: string, data: MarkAttendanceDTO) =>
    api
      .post<R<SessionAttendance>>(`/sessions/${sessionId}/attendances`, data)
      .then((r) => r.data.data),

  /** POST /sessions/:sessionId/attendances/bulk */
  bulkMarkAttendance: (sessionId: string, data: BulkAttendanceDTO) =>
    api
      .post<R<SessionAttendance[]>>(`/sessions/${sessionId}/attendances/bulk`, data)
      .then((r) => r.data.data),

  /** PUT /sessions/:sessionId/attendances/:attendanceId */
  updateAttendance: (sessionId: string, attendanceId: string, data: UpdateAttendanceDTO) =>
    api
      .put<R<SessionAttendance>>(`/sessions/${sessionId}/attendances/${attendanceId}`, data)
      .then((r) => r.data.data),

  /** POST /sessions/:sessionId/check-in */
  checkIn: (sessionId: string) =>
    api.post<R<SessionAttendance>>(`/sessions/${sessionId}/check-in`, {}).then((r) => r.data.data),

  /** POST /sessions/:sessionId/check-out */
  checkOut: (sessionId: string) =>
    api.post<R<SessionAttendance>>(`/sessions/${sessionId}/check-out`, {}).then((r) => r.data.data),

  // ── My Timetable & Attendance ─────────────────────────────────────────────

  /** GET /me/timetable */
  getMyTimetable: (params?: { week_offset?: number }) =>
    api.get<R<TimetableResponse>>("/me/timetable", { params }).then((r) => r.data.data),

  /** GET /me/attendances */
  getMyAttendances: (params?: { page?: number; page_size?: number }) =>
    api
      .get<R<{ attendances: SessionAttendance[]; total: number }>>("/me/attendances", { params })
      .then((r) => r.data.data),

  // ── Reminder Settings ─────────────────────────────────────────────────────

  /** GET /reminders/settings */
  getReminderSettings: () =>
    api.get<R<ReminderSetting[]>>("/reminders/settings").then((r) => r.data.data),

  /** PUT /reminders/settings */
  updateReminderSettings: (data: ReminderSetting) =>
    api.put<R<ReminderSetting>>("/reminders/settings", data).then((r) => r.data.data),
};
