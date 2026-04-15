import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  reportService,
  CreateReportDTO,
  UpdateReportStatusDTO,
  ReportStatus,
  ReportedType,
} from "@/services/report.service";

// ─── Query keys ────────────────────────────────────────────────────────────

export const reportKeys = {
  all: ["reports"] as const,
  list: () => [...reportKeys.all, "list"] as const,
  my: () => [...reportKeys.all, "my"] as const,
  detail: (id: string) => [...reportKeys.all, "detail", id] as const,
};

// ─── Queries ───────────────────────────────────────────────────────────────

export function useMyReports(params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: [...reportKeys.my(), params],
    queryFn: () => reportService.getMyReports(params),
  });
}

export function useAllReports(params?: {
  page?: number;
  page_size?: number;
  status?: ReportStatus;
  reported_type?: ReportedType;
}) {
  return useQuery({
    queryKey: [...reportKeys.list(), params],
    queryFn: () => reportService.list(params),
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => reportService.getById(id),
    enabled: !!id,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReportDTO) => reportService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.my() });
      toast.success("Đã gửi báo cáo vi phạm");
    },
    onError: () => {
      toast.error("Không thể gửi báo cáo");
    },
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReportStatusDTO }) =>
      reportService.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.list() });
      toast.success("Đã cập nhật trạng thái báo cáo");
    },
    onError: () => {
      toast.error("Không thể cập nhật trạng thái");
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reportService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.my() });
      toast.success("Đã xóa báo cáo");
    },
    onError: () => {
      toast.error("Không thể xóa báo cáo");
    },
  });
}
