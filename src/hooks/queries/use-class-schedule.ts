/**
 * React Query hooks for class schedule management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { classScheduleService } from "@/services/class-schedule.service";
import type {
  ClassScheduleFilters,
  CreateClassScheduleDTO,
  UpdateClassScheduleDTO,
} from "@/types/class-schedule";

export const classScheduleKeys = {
  all: ["class-schedules"] as const,
  list: (filters?: ClassScheduleFilters) => [...classScheduleKeys.all, "list", filters] as const,
  detail: (id: string) => [...classScheduleKeys.all, "detail", id] as const,
  my: () => [...classScheduleKeys.all, "my"] as const,
  teacher: () => [...classScheduleKeys.all, "teacher"] as const,
};

/** List standalone class schedules (from /class-schedules endpoint) */
export function useAllClassSchedules(filters?: ClassScheduleFilters) {
  return useQuery({
    queryKey: classScheduleKeys.list(filters),
    queryFn: () => classScheduleService.getSchedules(filters),
  });
}

export function useClassSchedule(id: string) {
  return useQuery({
    queryKey: classScheduleKeys.detail(id),
    queryFn: () => classScheduleService.getSchedule(id),
    enabled: !!id,
  });
}

export function useMySchedules() {
  return useQuery({
    queryKey: classScheduleKeys.my(),
    queryFn: () => classScheduleService.getMySchedules(),
  });
}

export function useTeacherSchedules() {
  return useQuery({
    queryKey: classScheduleKeys.teacher(),
    queryFn: () => classScheduleService.getTeacherSchedules(),
  });
}

export function useCreateClassSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClassScheduleDTO) => classScheduleService.createSchedule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classScheduleKeys.all });
      toast.success("Tạo lịch học thành công");
    },
    onError: () => toast.error("Không thể tạo lịch học"),
  });
}

export function useUpdateClassSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClassScheduleDTO }) =>
      classScheduleService.updateSchedule(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: classScheduleKeys.all });
      qc.invalidateQueries({ queryKey: classScheduleKeys.detail(id) });
      toast.success("Cập nhật lịch học thành công");
    },
    onError: () => toast.error("Không thể cập nhật lịch học"),
  });
}

export function useDeleteClassSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classScheduleService.deleteSchedule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classScheduleKeys.all });
      toast.success("Xóa lịch học thành công");
    },
    onError: () => toast.error("Không thể xóa lịch học"),
  });
}
