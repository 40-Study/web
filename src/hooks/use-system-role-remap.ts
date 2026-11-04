"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { mapOrgRoleToSystemRole } from "@/lib/role-resolution";
import { normalizeRole } from "@/lib/routes";

/**
 * Q3-05: vai đang dùng là vai tuỳ biến của tổ chức (vd QA3_TEACHER) -> ghi vai HỆ THỐNG tương ứng vào store, để
 * mọi nơi đọc `activeRole` trực tiếp (RoleGuard, header, sidebar, bottom-nav) cùng dựng đúng giao diện thay vì
 * đá người dùng sang /403. Dùng ở mọi điểm vào có thể gặp vai lạ: (app)/layout, trang chủ "/", trang 403.
 *
 * `needsRemap` = true cho tới khi store được ghi: caller nên chưa dựng nội dung bảo vệ trong lúc đó.
 */
export function useSystemRoleRemap() {
  const { isAuthenticated, hasHydrated, activeRole, roles, setActiveRole } = useAuthStore();
  const systemRole = mapOrgRoleToSystemRole(activeRole, roles);
  const needsRemap = hasHydrated && isAuthenticated && !!systemRole && normalizeRole(activeRole) !== systemRole;

  useEffect(() => {
    if (needsRemap && systemRole) setActiveRole(systemRole);
  }, [needsRemap, systemRole, setActiveRole]);

  return { systemRole, needsRemap };
}
