/**
 * React Query hooks quản lý một lớp chỉ bằng classId (khu tổ chức, lớp không gắn khoá, trang quản lý của giảng viên).
 * Quyền do backend quyết: chi tiết lớp trả can_manage / can_assign_teachers, UI chỉ đọc hai cờ đó.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-messages";
import { classService, type UpdateClassDTO } from "@/services/class.service";

export const classManageKeys = {
  all: ["class-manage"] as const,
  detail: (classId: string) => [...classManageKeys.all, "detail", classId] as const,
  teachers: (classId: string) => [...classManageKeys.all, "teachers", classId] as const,
  students: (classId: string) => [...classManageKeys.all, "students", classId] as const,
};

export function useClassById(classId: string) {
  return useQuery({
    queryKey: classManageKeys.detail(classId),
    queryFn: () => classService.getByClassId(classId),
    enabled: !!classId,
  });
}

export function useClassTeachersById(classId: string) {
  return useQuery({
    queryKey: classManageKeys.teachers(classId),
    queryFn: () => classService.listTeachersByClassId(classId),
    enabled: !!classId,
  });
}

export function useClassStudentsById(classId: string) {
  return useQuery({
    queryKey: classManageKeys.students(classId),
    queryFn: () => classService.listStudentsByClassId(classId),
    enabled: !!classId,
  });
}

/** Gom các thao tác ghi của một lớp; mỗi thao tác làm mới đúng phần dữ liệu bị đổi và báo bằng toast. */
export function useClassManageActions(classId: string) {
  const qc = useQueryClient();
  const refreshAll = () => qc.invalidateQueries({ queryKey: classManageKeys.all });
  const fail = (title: string) => (err: unknown) => toast.error(title, { description: getErrorMessage(err) });

  const update = useMutation({
    mutationFn: (data: UpdateClassDTO) => classService.updateByClassId(classId, data),
    onSuccess: (_, data) => {
      refreshAll();
      toast.success(
        data.status === "active" ? "Đã kích hoạt lớp" : data.status === "archived" ? "Đã lưu trữ lớp" : "Đã cập nhật lớp"
      );
    },
    onError: fail("Không thể cập nhật lớp"),
  });

  const assignTeacher = useMutation({
    mutationFn: (teacherId: string) => classService.assignTeacherByClassId(classId, teacherId),
    onSuccess: () => {
      refreshAll();
      toast.success("Đã gán giảng viên vào lớp");
    },
    onError: fail("Không thể gán giảng viên"),
  });

  const removeTeacher = useMutation({
    mutationFn: (teacherId: string) => classService.removeTeacherByClassId(classId, teacherId),
    onSuccess: () => {
      refreshAll();
      toast.success("Đã gỡ giảng viên khỏi lớp");
    },
    onError: fail("Không thể gỡ giảng viên"),
  });

  const enrollStudent = useMutation({
    mutationFn: (studentId: string) => classService.enrollStudentByClassId(classId, studentId),
    onSuccess: () => {
      refreshAll();
      toast.success("Đã ghi danh học viên");
    },
    onError: fail("Không thể ghi danh học viên"),
  });

  const removeStudent = useMutation({
    mutationFn: (studentId: string) => classService.removeStudentByClassId(classId, studentId),
    onSuccess: () => {
      refreshAll();
      toast.success("Đã gỡ học viên khỏi lớp");
    },
    onError: fail("Không thể gỡ học viên"),
  });

  return { update, assignTeacher, removeTeacher, enrollStudent, removeStudent };
}
