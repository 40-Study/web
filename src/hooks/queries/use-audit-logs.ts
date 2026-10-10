/**
 * React Query hooks — nhật ký hoạt động quản trị (bộ lọc nằm trên URL của trang, hook chỉ nhận params).
 */

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { auditLogService, type AuditLogParams } from "@/services/audit-log.service";

export const auditLogKeys = {
  all: ["admin-audit-logs"] as const,
  list: (params?: AuditLogParams) => [...auditLogKeys.all, "list", params ?? {}] as const,
  actions: ["admin-audit-logs", "actions"] as const,
};

/** GET /admin/audit-logs — giữ trang cũ trên màn hình khi chuyển trang/đổi bộ lọc. */
export function useAuditLogs(params?: AuditLogParams) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => auditLogService.list(params),
    placeholderData: keepPreviousData,
  });
}

/** GET /admin/audit-logs/actions — danh sách gần như tĩnh nên cache dài. */
export function useAuditLogActions() {
  return useQuery({
    queryKey: auditLogKeys.actions,
    queryFn: () => auditLogService.actions(),
    staleTime: 10 * 60 * 1000,
  });
}
