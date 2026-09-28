/**
 * React Query hooks — báo cáo doanh thu nền tảng thật + cấu hình % phí nền tảng
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminReportService,
  type RevenueReportParams,
} from "@/services/admin-report.service";
import { ApiError } from "@/lib/errors";

export const adminReportKeys = {
  revenue: (params?: RevenueReportParams) => ["admin-reports", "revenue", params ?? {}] as const,
  platformFee: ["admin-settings", "platform-fee"] as const,
};

/** GET /admin/reports/revenue — doanh thu nền tảng thật (gộp/phí/phần GV), không phải ví admin. */
export function useAdminRevenueReport(params?: RevenueReportParams) {
  return useQuery({
    queryKey: adminReportKeys.revenue(params),
    queryFn: () => adminReportService.getRevenueReport(params),
  });
}

/** GET /admin/settings/platform-fee — % phí hiện hành. */
export function usePlatformFeeSetting() {
  return useQuery({
    queryKey: adminReportKeys.platformFee,
    queryFn: () => adminReportService.getPlatformFee(),
  });
}

/** PUT /admin/settings/platform-fee — chỉ ảnh hưởng đơn hoàn tất SAU thời điểm đổi. */
export function useUpdatePlatformFeeSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (percent: number) => adminReportService.updatePlatformFee(percent),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminReportKeys.platformFee });
      toast.success("Đã cập nhật % phí nền tảng");
    },
    onError: (error) => {
      const message =
        error instanceof ApiError && error.message
          ? error.message
          : "Không thể cập nhật % phí nền tảng";
      toast.error(message);
    },
  });
}
