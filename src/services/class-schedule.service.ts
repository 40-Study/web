/**
 * Class schedule service
 *
 * `/class-schedules/*` KHÔNG tồn tại trong backend (đã grep
 * internal/router/*.go, 2026-09-09 — H1 trong plans/reports/code-reviewer-
 * 260909-1340-web-logic-integration.md). Danh sách lịch cá nhân dùng
 * `GET /me/timetable`. Các endpoint CRUD lịch theo lớp dùng
 * `/classes/:classId/schedules` (xem session.service.ts) — KHÔNG có group
 * `/class-schedules` độc lập, nên getSchedules/getSchedule/create/update/
 * delete bên dưới vẫn trỏ vào endpoint không tồn tại và chưa có nơi nào gọi
 * (đã grep, dead code) — giữ nguyên chữ ký để không phá hooks đang import,
 * nhưng KHÔNG dùng cho tới khi có backend endpoint tương ứng.
 */

import { api } from "@/lib/api-client";
import type {
  ClassSchedule,
  CreateClassScheduleDTO,
  UpdateClassScheduleDTO,
  ClassScheduleFilters,
  TimetableEntry,
} from "@/types/class-schedule";

type ApiResponse<T> = { message: string; data: T };

interface TimetableResponse {
  entries: TimetableEntry[];
  week?: string;
}

function timetableEntryToClassSchedule(entry: TimetableEntry): ClassSchedule {
  return {
    id: entry.session_id ?? entry.schedule_id ?? `${entry.class_id}-${entry.day_of_week}-${entry.start_time}`,
    class_id: entry.class_id,
    title: entry.topic || entry.class_name,
    day_of_week: entry.day_of_week,
    start_time: entry.start_time,
    end_time: entry.end_time,
    room: entry.room,
    created_at: "",
    updated_at: "",
  };
}

export const classScheduleService = {
  /** @deprecated /class-schedules không tồn tại ở backend — chưa có nơi gọi (dead code) */
  getSchedules: (filters?: ClassScheduleFilters) =>
    api
      .get<ApiResponse<{ schedules: ClassSchedule[] }>>("/class-schedules", {
        params: filters as Record<string, string>,
      })
      .then((r) => r.data.data.schedules),

  /** @deprecated /class-schedules không tồn tại ở backend — chưa có nơi gọi (dead code) */
  getSchedule: (id: string) =>
    api
      .get<ApiResponse<ClassSchedule>>(`/class-schedules/${id}`)
      .then((r) => r.data.data),

  /** @deprecated /class-schedules không tồn tại ở backend — chưa có nơi gọi (dead code) */
  createSchedule: (data: CreateClassScheduleDTO) =>
    api
      .post<ApiResponse<ClassSchedule>>("/class-schedules", data)
      .then((r) => r.data.data),

  /** @deprecated /class-schedules không tồn tại ở backend — chưa có nơi gọi (dead code) */
  updateSchedule: (id: string, data: UpdateClassScheduleDTO) =>
    api
      .put<ApiResponse<ClassSchedule>>(`/class-schedules/${id}`, data)
      .then((r) => r.data.data),

  /** @deprecated /class-schedules không tồn tại ở backend — chưa có nơi gọi (dead code) */
  deleteSchedule: (id: string) =>
    api
      .delete<ApiResponse<null>>(`/class-schedules/${id}`)
      .then((r) => r.data),

  /** GET /me/timetable — lịch cá nhân của học viên/giáo viên hiện tại (H1 fix) */
  getMySchedules: () =>
    api
      .get<ApiResponse<TimetableResponse>>("/me/timetable")
      .then((r) => r.data.data.entries.map(timetableEntryToClassSchedule)),

  /** @deprecated /class-schedules/teacher không tồn tại ở backend — chưa có nơi gọi (dead code) */
  getTeacherSchedules: () =>
    api
      .get<ApiResponse<{ schedules: ClassSchedule[] }>>("/class-schedules/teacher")
      .then((r) => r.data.data.schedules),
};
