/**
 * React Query hooks for class management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { classService, type CreateClassDTO, type UpdateClassDTO } from "@/services/class.service";
import { teacherService } from "@/services/teacher.service";

export const classKeys = {
  all: ["classes"] as const,
  list: (courseId: string) => [...classKeys.all, "list", courseId] as const,
  detail: (courseId: string, classId: string) =>
    [...classKeys.all, "detail", courseId, classId] as const,
  students: (courseId: string, classId: string) =>
    [...classKeys.all, "students", courseId, classId] as const,
  teachers: (courseId: string, classId: string) =>
    [...classKeys.all, "teachers", courseId, classId] as const,
  attendances: (courseId: string, classId: string) =>
    [...classKeys.all, "attendances", courseId, classId] as const,
};

/** List classes for a course */
export function useClasses(courseId: string) {
  return useQuery({
    queryKey: classKeys.list(courseId),
    queryFn: () => classService.list(courseId),
    enabled: !!courseId,
  });
}

/** Get a single class */
export function useClass(courseId: string, classId: string) {
  return useQuery({
    queryKey: classKeys.detail(courseId, classId),
    queryFn: () => classService.getById(courseId, classId),
    enabled: !!courseId && !!classId,
  });
}

/** Create a class under a course */
export function useCreateClass(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClassDTO) => classService.create(courseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.list(courseId) });
      toast.success("Tạo lớp học thành công");
    },
  });
}

/** Update a class */
export function useUpdateClass(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, data }: { classId: string; data: UpdateClassDTO }) =>
      classService.update(courseId, classId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.list(courseId) });
      toast.success("Cập nhật thành công");
    },
  });
}

/** Delete a class */
export function useDeleteClass(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => classService.delete(courseId, classId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.list(courseId) });
      toast.success("Xóa lớp học thành công");
    },
  });
}

/** Get students in a class */
export function useClassStudents(courseId: string, classId: string) {
  return useQuery({
    queryKey: classKeys.students(courseId, classId),
    queryFn: () => classService.getStudents(courseId, classId),
    enabled: !!courseId && !!classId,
  });
}

/** Add a student to a class */
export function useAddStudent(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) =>
      classService.addStudent(courseId, classId, studentId),
    onSuccess: (_, { classId }) => {
      qc.invalidateQueries({ queryKey: classKeys.students(courseId, classId) });
      toast.success("Thêm học sinh thành công");
    },
  });
}

/** Get teachers in a class */
export function useClassTeachers(courseId: string, classId: string) {
  return useQuery({
    queryKey: classKeys.teachers(courseId, classId),
    queryFn: () => classService.getTeachers(courseId, classId),
    enabled: !!courseId && !!classId,
  });
}

/** Get attendances for a class */
export function useAttendances(courseId: string, classId: string) {
  return useQuery({
    queryKey: classKeys.attendances(courseId, classId),
    queryFn: () => classService.getAttendances(courseId, classId),
    enabled: !!courseId && !!classId,
  });
}

/** All students across teacher's classes */
export function useMyStudents(pageSize = 200) {
  return useQuery({
    queryKey: [...classKeys.all, "my-students", pageSize] as const,
    queryFn: () => teacherService.getMyStudents(pageSize),
  });
}
