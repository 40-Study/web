import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  gradeService,
  CreateGradeColumnDTO,
  UpdateGradeColumnDTO,
  CreateGradeDTO,
  BulkCreateGradeDTO,
  UpdateGradeDTO,
  UpdateFinalGradeDTO,
} from "@/services/grade.service";

// ─── Query keys ────────────────────────────────────────────────────────────

export const gradeKeys = {
  all: ["grades"] as const,
  columns: (classId: string) => [...gradeKeys.all, "columns", classId] as const,
  book: (classId: string) => [...gradeKeys.all, "book", classId] as const,
  student: (classId: string, studentId: string) =>
    [...gradeKeys.all, "student", classId, studentId] as const,
  final: (classId: string) => [...gradeKeys.all, "final", classId] as const,
  my: () => [...gradeKeys.all, "my"] as const,
  myClass: (classId: string) => [...gradeKeys.all, "my", classId] as const,
};

// ─── Grade Columns ─────────────────────────────────────────────────────────

export function useGradeColumns(classId: string) {
  return useQuery({
    queryKey: gradeKeys.columns(classId),
    queryFn: () => gradeService.getColumns(classId),
    enabled: !!classId,
  });
}

export function useCreateGradeColumn(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGradeColumnDTO) => gradeService.createColumn(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.columns(classId) });
      toast.success("Đã tạo cột điểm");
    },
    onError: () => toast.error("Không thể tạo cột điểm"),
  });
}

export function useUpdateGradeColumn(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, data }: { columnId: string; data: UpdateGradeColumnDTO }) =>
      gradeService.updateColumn(classId, columnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.columns(classId) });
      toast.success("Đã cập nhật cột điểm");
    },
    onError: () => toast.error("Không thể cập nhật cột điểm"),
  });
}

export function useDeleteGradeColumn(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (columnId: string) => gradeService.deleteColumn(classId, columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.columns(classId) });
      toast.success("Đã xóa cột điểm");
    },
    onError: () => toast.error("Không thể xóa cột điểm"),
  });
}

// ─── Grades ────────────────────────────────────────────────────────────────

export function useGradeBook(classId: string) {
  return useQuery({
    queryKey: gradeKeys.book(classId),
    queryFn: () => gradeService.getGradeBook(classId),
    enabled: !!classId,
  });
}

export function useStudentGrades(classId: string, studentId: string) {
  return useQuery({
    queryKey: gradeKeys.student(classId, studentId),
    queryFn: () => gradeService.getStudentGrades(classId, studentId),
    enabled: !!classId && !!studentId,
  });
}

export function useCreateGrade(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGradeDTO) => gradeService.createGrade(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.book(classId) });
      toast.success("Đã nhập điểm");
    },
    onError: () => toast.error("Không thể nhập điểm"),
  });
}

export function useBulkCreateGrades(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCreateGradeDTO) => gradeService.bulkCreateGrades(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.book(classId) });
      toast.success("Đã nhập điểm hàng loạt");
    },
    onError: () => toast.error("Không thể nhập điểm"),
  });
}

export function useUpdateGrade(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gradeId, data }: { gradeId: string; data: UpdateGradeDTO }) =>
      gradeService.updateGrade(gradeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.book(classId) });
      toast.success("Đã cập nhật điểm");
    },
    onError: () => toast.error("Không thể cập nhật điểm"),
  });
}

export function useDeleteGrade(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gradeId: string) => gradeService.deleteGrade(gradeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.book(classId) });
      toast.success("Đã xóa điểm");
    },
    onError: () => toast.error("Không thể xóa điểm"),
  });
}

// ─── Final Grades ──────────────────────────────────────────────────────────

export function useFinalGrades(classId: string) {
  return useQuery({
    queryKey: gradeKeys.final(classId),
    queryFn: () => gradeService.getFinalGrades(classId),
    enabled: !!classId,
  });
}

export function useCalculateFinalGrades(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gradeService.calculateFinalGrades(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.final(classId) });
      toast.success("Đã tính điểm tổng kết");
    },
    onError: () => toast.error("Không thể tính điểm tổng kết"),
  });
}

export function useUpdateFinalGrade(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ finalGradeId, data }: { finalGradeId: string; data: UpdateFinalGradeDTO }) =>
      gradeService.updateFinalGrade(classId, finalGradeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.final(classId) });
      toast.success("Đã cập nhật điểm tổng kết");
    },
    onError: () => toast.error("Không thể cập nhật điểm tổng kết"),
  });
}

export function useFinalizeFinalGrades(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gradeService.finalizeFinalGrades(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.final(classId) });
      toast.success("Đã chốt điểm tổng kết");
    },
    onError: () => toast.error("Không thể chốt điểm"),
  });
}

// ─── My Grades ─────────────────────────────────────────────────────────────

export function useMyGrades() {
  return useQuery({
    queryKey: gradeKeys.my(),
    queryFn: () => gradeService.getMyGrades(),
  });
}

export function useMyGradesInClass(classId: string) {
  return useQuery({
    queryKey: gradeKeys.myClass(classId),
    queryFn: () => gradeService.getMyGradesInClass(classId),
    enabled: !!classId,
  });
}
