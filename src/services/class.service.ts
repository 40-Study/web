/**
 * Class management service
 */

import { api } from "@/lib/api-client";

export interface Class {
  id: string;
  name: string;
  code: string;
  description?: string;
  organization_id: string;
  teacher_ids: string[];
  student_count: number;
  created_at: string;
}

export interface Schedule {
  id: string;
  class_id: string;
  day_of_week: number; // 0-6
  start_time: string;  // HH:mm
  end_time: string;
  room?: string;
}

export interface Attendance {
  id: string;
  class_id: string;
  student_id: string;
  student_name: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  note?: string;
}

export interface CreateClassDTO {
  name: string;
  code: string;
  description?: string;
  organization_id: string;
}

export interface CreateScheduleDTO {
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
}

export interface MarkAttendanceDTO {
  student_id: string;
  date: string;
  status: Attendance["status"];
  note?: string;
}

export const classService = {
  // Classes
  list: (orgId?: string) =>
    api.get<{ classes: Class[] }>("/classes", { params: orgId ? { org_id: orgId } : {} }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Class>(`/classes/${id}`).then((r) => r.data),

  create: (data: CreateClassDTO) =>
    api.post<Class>("/classes", data).then((r) => r.data),

  update: (id: string, data: Partial<CreateClassDTO>) =>
    api.put<Class>(`/classes/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<void>(`/classes/${id}`).then((r) => r.data),

  // Teachers
  assignTeacher: (classId: string, teacherId: string) =>
    api.post<void>(`/classes/${classId}/teachers`, { teacher_id: teacherId }).then((r) => r.data),

  removeTeacher: (classId: string, teacherId: string) =>
    api.delete<void>(`/classes/${classId}/teachers/${teacherId}`).then((r) => r.data),

  // Students
  enrollStudent: (classId: string, studentId: string) =>
    api.post<void>(`/classes/${classId}/students`, { student_id: studentId }).then((r) => r.data),

  removeStudent: (classId: string, studentId: string) =>
    api.delete<void>(`/classes/${classId}/students/${studentId}`).then((r) => r.data),

  getStudents: (classId: string) =>
    api.get<{ students: { id: string; name: string; email: string }[] }>(`/classes/${classId}/students`).then((r) => r.data),

  // Schedules
  getSchedules: (classId: string) =>
    api.get<{ schedules: Schedule[] }>(`/classes/${classId}/schedules`).then((r) => r.data),

  createSchedule: (classId: string, data: CreateScheduleDTO) =>
    api.post<Schedule>(`/classes/${classId}/schedules`, data).then((r) => r.data),

  updateSchedule: (classId: string, scheduleId: string, data: Partial<CreateScheduleDTO>) =>
    api.put<Schedule>(`/classes/${classId}/schedules/${scheduleId}`, data).then((r) => r.data),

  deleteSchedule: (classId: string, scheduleId: string) =>
    api.delete<void>(`/classes/${classId}/schedules/${scheduleId}`).then((r) => r.data),

  // Attendance
  getAttendance: (classId: string, date: string) =>
    api.get<{ attendance: Attendance[] }>(`/classes/${classId}/attendances`, { params: { date } }).then((r) => r.data),

  markAttendance: (classId: string, data: MarkAttendanceDTO) =>
    api.post<Attendance>(`/classes/${classId}/attendances`, data).then((r) => r.data),

  updateAttendance: (classId: string, attendanceId: string, data: Partial<MarkAttendanceDTO>) =>
    api.put<Attendance>(`/classes/${classId}/attendances/${attendanceId}`, data).then((r) => r.data),
};
