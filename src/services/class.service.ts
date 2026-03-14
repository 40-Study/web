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

export interface BulkAttendanceDTO {
  date: string;
  records: MarkAttendanceDTO[];
}

export const classService = {
  // Classes
  list: (orgId?: string) =>
    api.get<{ message: string; data: { classes: Class[] } }>("/classes", { params: orgId ? { organization_id: orgId } : {} })
      .then((r) => r.data.data.classes),

  getById: (id: string) =>
    api.get<{ message: string; data: Class }>(`/classes/${id}`).then((r) => r.data.data),

  create: (data: CreateClassDTO) =>
    api.post<{ message: string; data: Class }>("/classes", data).then((r) => r.data.data),

  update: (id: string, data: Partial<CreateClassDTO>) =>
    api.put<{ message: string; data: Class }>(`/classes/${id}`, data).then((r) => r.data.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/classes/${id}`).then((r) => r.data),

  // Teachers
  assignTeacher: (classId: string, teacherId: string) =>
    api.post<{ message: string }>(`/classes/${classId}/teachers`, { teacher_id: teacherId }).then((r) => r.data),

  removeTeacher: (classId: string, teacherId: string) =>
    api.delete<{ message: string }>(`/classes/${classId}/teachers/${teacherId}`).then((r) => r.data),

  // Students
  enrollStudent: (classId: string, studentId: string) =>
    api.post<{ message: string }>(`/classes/${classId}/students`, { student_id: studentId }).then((r) => r.data),

  removeStudent: (classId: string, studentId: string) =>
    api.delete<{ message: string }>(`/classes/${classId}/students/${studentId}`).then((r) => r.data),

  getStudents: (classId: string) =>
    api.get<{ message: string; data: { students: { id: string; name: string; email: string }[] } }>(
      `/classes/${classId}/students`
    ).then((r) => r.data.data.students),

  // Schedules
  getSchedules: (classId: string) =>
    api.get<{ message: string; data: { schedules: Schedule[] } }>(`/classes/${classId}/schedules`)
      .then((r) => r.data.data.schedules),

  createSchedule: (classId: string, data: CreateScheduleDTO) =>
    api.post<{ message: string; data: Schedule }>(`/classes/${classId}/schedules`, data)
      .then((r) => r.data.data),

  updateSchedule: (classId: string, scheduleId: string, data: Partial<CreateScheduleDTO>) =>
    api.put<{ message: string; data: Schedule }>(`/classes/${classId}/schedules/${scheduleId}`, data)
      .then((r) => r.data.data),

  deleteSchedule: (classId: string, scheduleId: string) =>
    api.delete<{ message: string }>(`/classes/${classId}/schedules/${scheduleId}`).then((r) => r.data),

  // Attendance - Backend expects bulk DTO
  getAttendance: (classId: string, date: string) =>
    api.get<{ message: string; data: { attendance: Attendance[] } }>(
      `/classes/${classId}/attendances`, { params: { date } }
    ).then((r) => r.data.data.attendance),

  markAttendance: (classId: string, data: BulkAttendanceDTO) =>
    api.post<{ message: string; data: { attendance: Attendance[] } }>(`/classes/${classId}/attendances`, data)
      .then((r) => r.data.data.attendance),

  updateAttendance: (classId: string, attendanceId: string, data: Partial<MarkAttendanceDTO>) =>
    api.put<{ message: string; data: Attendance }>(`/classes/${classId}/attendances/${attendanceId}`, data)
      .then((r) => r.data.data),
};
