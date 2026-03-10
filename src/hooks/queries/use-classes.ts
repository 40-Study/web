/**
 * React Query hooks for class management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { classService } from "@/services/class.service";

export const classKeys = {
  all: ["classes"] as const,
  list: (orgId?: string) => [...classKeys.all, "list", orgId] as const,
  detail: (id: string) => [...classKeys.all, "detail", id] as const,
  students: (id: string) => [...classKeys.all, "students", id] as const,
  schedules: (id: string) => [...classKeys.all, "schedules", id] as const,
  attendance: (id: string, date: string) => [...classKeys.all, "attendance", id, date] as const,
};

export function useClasses(orgId?: string) {
  return useQuery({
    queryKey: classKeys.list(orgId),
    queryFn: () => classService.list(orgId),
  });
}

export function useClass(id: string) {
  return useQuery({
    queryKey: classKeys.detail(id),
    queryFn: () => classService.getById(id),
    enabled: !!id,
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: classService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.all });
      toast.success("Tạo lớp học thành công");
    },
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof classService.update>[1] }) =>
      classService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.all });
      toast.success("Cập nhật thành công");
    },
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: classService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.all });
      toast.success("Xóa lớp học thành công");
    },
  });
}

export function useClassStudents(classId: string) {
  return useQuery({
    queryKey: classKeys.students(classId),
    queryFn: () => classService.getStudents(classId),
    enabled: !!classId,
  });
}

export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) =>
      classService.enrollStudent(classId, studentId),
    onSuccess: (_, { classId }) => {
      qc.invalidateQueries({ queryKey: classKeys.students(classId) });
      toast.success("Thêm học sinh thành công");
    },
  });
}

export function useClassSchedules(classId: string) {
  return useQuery({
    queryKey: classKeys.schedules(classId),
    queryFn: () => classService.getSchedules(classId),
    enabled: !!classId,
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, data }: { classId: string; data: Parameters<typeof classService.createSchedule>[1] }) =>
      classService.createSchedule(classId, data),
    onSuccess: (_, { classId }) => {
      qc.invalidateQueries({ queryKey: classKeys.schedules(classId) });
      toast.success("Thêm lịch học thành công");
    },
  });
}

export function useAttendance(classId: string, date: string) {
  return useQuery({
    queryKey: classKeys.attendance(classId, date),
    queryFn: () => classService.getAttendance(classId, date),
    enabled: !!classId && !!date,
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, data }: { classId: string; data: Parameters<typeof classService.markAttendance>[1] }) =>
      classService.markAttendance(classId, data),
    onSuccess: (_, { classId, data }) => {
      qc.invalidateQueries({ queryKey: classKeys.attendance(classId, data.date) });
      toast.success("Điểm danh thành công");
    },
  });
}
