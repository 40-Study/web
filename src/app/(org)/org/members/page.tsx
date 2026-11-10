"use client";

import { OrgMembersPanel } from "@/components/org-members/org-members-panel";
import { useActiveOrgId } from "@/hooks/queries/use-org-area";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Thành viên tổ chức (chủ tổ chức): xem, thêm, đổi/gỡ vai trò. QA-C-01: chủ tổ chức không có quyền liệt kê người
 * dùng (GET /users cần USERS_VIEW_ALL) nên thêm người bằng email chính xác qua GET /organizations/:id/user-lookup
 * (backend PR #144), rồi gán vai qua POST /users/:id/org-roles như quản trị hệ thống.
 */
export default function OrgMembersPage() {
  const orgId = useActiveOrgId();
  const currentUserId = useAuthStore((s) => s.user?.id);
  return <OrgMembersPanel orgId={orgId} canAddMember memberLookup="email" currentUserId={currentUserId} />;
}
