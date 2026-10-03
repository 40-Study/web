/**
 * Hooks cho khu quản lý tổ chức (/org/**). Tổ chức lấy từ vai trò đang dùng (activeOrg trong auth store): chủ tổ chức
 * chỉ làm việc trong tổ chức đó, đúng với kiểm RequireOrgPermission ở backend (active_org_id phải khớp).
 */

import { useQuery } from "@tanstack/react-query";
import { organizationService } from "@/services/organization.service";
import { useAuthStore } from "@/stores/auth.store";

export const orgAreaKeys = {
  all: ["org-area"] as const,
  detail: (orgId: string) => [...orgAreaKeys.all, "detail", orgId] as const,
  members: (orgId: string) => [...orgAreaKeys.all, "members", orgId] as const,
  classes: (orgId: string, filter: { keyword: string; status: string; page: number }) =>
    [...orgAreaKeys.all, "classes", orgId, filter] as const,
};

/** id tổ chức của vai trò đang dùng; rỗng khi vai trò không gắn tổ chức. */
export function useActiveOrgId(): string {
  return useAuthStore((s) => s.activeOrg?.id) ?? "";
}

export function useOrgDetail(orgId: string) {
  return useQuery({
    queryKey: orgAreaKeys.detail(orgId),
    queryFn: () => organizationService.getById(orgId),
    enabled: !!orgId,
  });
}

export function useOrgMembers(orgId: string) {
  return useQuery({
    queryKey: orgAreaKeys.members(orgId),
    queryFn: () => organizationService.getMembers(orgId),
    enabled: !!orgId,
  });
}

export function useOrgClasses(orgId: string, filter: { keyword: string; status: string; page: number }) {
  return useQuery({
    queryKey: orgAreaKeys.classes(orgId, filter),
    queryFn: () =>
      organizationService.getClasses(orgId, {
        keyword: filter.keyword || undefined,
        status: filter.status || undefined,
        page: filter.page,
        page_size: 20,
      }),
    enabled: !!orgId,
    placeholderData: (prev) => prev,
  });
}
