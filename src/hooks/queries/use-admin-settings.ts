/**
 * React Query hook — trang "Cấu hình hệ thống" (GET /admin/settings, contract C4).
 * Ghi vẫn đi qua useUpdatePlatformFeeSetting (use-admin-reports.ts), hook đó làm mới key này.
 */

import { useQuery } from "@tanstack/react-query";
import { adminReportService } from "@/services/admin-report.service";
import { ADMIN_SETTINGS_KEY_PREFIX } from "@/hooks/queries/use-admin-reports";

export const adminSettingsKeys = {
  detail: [...ADMIN_SETTINGS_KEY_PREFIX, "detail"] as const,
};

export function useAdminSettings() {
  return useQuery({
    queryKey: adminSettingsKeys.detail,
    queryFn: () => adminReportService.getAdminSettings(),
  });
}
