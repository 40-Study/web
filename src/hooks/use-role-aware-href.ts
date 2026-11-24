"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { mapOrgRoleToSystemRole } from "@/lib/role-resolution";
import { resolveRoleAwareHref } from "@/lib/routes";

/**
 * Round 2 (web#128 follow-up): link nội bộ tới route CHỈ DÀNH CHO HỌC VIÊN (/my-courses, /schedule...) mà giảng viên
 * cũng gặp. Trả hàm đổi `href` theo vai đang dùng (giảng viên -> trang giảng viên tương ứng) để bấm vào không bị guard
 * của (app)/layout đá lại kèm toast. Vai tuỳ biến của tổ chức được quy về vai hệ thống trước, như `player-header`.
 * Điểm vào chung cho component client; hàm thuần nằm ở `resolveRoleAwareHref` (lib/routes).
 */
export function useRoleAwareHref(): (href: string) => string {
  const activeRole = useAuthStore((s) => s.activeRole);
  const roles = useAuthStore((s) => s.roles);
  const role = mapOrgRoleToSystemRole(activeRole, roles) ?? activeRole;
  return useCallback((href: string) => resolveRoleAwareHref(href, role), [role]);
}
