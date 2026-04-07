/**
 * Class schedule service - handles /class-schedules API endpoints
 */

import { api } from "@/lib/api-client";
import type {
  ClassSchedule,
  CreateClassScheduleDTO,
  UpdateClassScheduleDTO,
  ClassScheduleFilters,
} from "@/types/class-schedule";

type ApiResponse<T> = { message: string; data: T };

export const classScheduleService = {
  /** GET /class-schedules - list all schedules with optional filters */
  getSchedules: (filters?: ClassScheduleFilters) =>
    api
      .get<ApiResponse<{ schedules: ClassSchedule[] }>>("/class-schedules", {
        params: filters as Record<string, string>,
      })
      .then((r) => r.data.data.schedules),

  /** GET /class-schedules/:id - get a single schedule */
  getSchedule: (id: string) =>
    api
      .get<ApiResponse<ClassSchedule>>(`/class-schedules/${id}`)
      .then((r) => r.data.data),

  /** POST /class-schedules - create a new schedule */
  createSchedule: (data: CreateClassScheduleDTO) =>
    api
      .post<ApiResponse<ClassSchedule>>("/class-schedules", data)
      .then((r) => r.data.data),

  /** PUT /class-schedules/:id - update a schedule */
  updateSchedule: (id: string, data: UpdateClassScheduleDTO) =>
    api
      .put<ApiResponse<ClassSchedule>>(`/class-schedules/${id}`, data)
      .then((r) => r.data.data),

  /** DELETE /class-schedules/:id - delete a schedule */
  deleteSchedule: (id: string) =>
    api
      .delete<ApiResponse<null>>(`/class-schedules/${id}`)
      .then((r) => r.data),

  /** GET /class-schedules/my - get schedules for the current student */
  getMySchedules: () =>
    api
      .get<ApiResponse<{ schedules: ClassSchedule[] }>>("/class-schedules/my")
      .then((r) => r.data.data.schedules),

  /** GET /class-schedules/teacher - get schedules for the current teacher */
  getTeacherSchedules: () =>
    api
      .get<ApiResponse<{ schedules: ClassSchedule[] }>>("/class-schedules/teacher")
      .then((r) => r.data.data.schedules),
};
