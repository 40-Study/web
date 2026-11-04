"use client";

import { OrgMembersPanel } from "@/components/org-members/org-members-panel";
import { useActiveOrgId } from "@/hooks/queries/use-org-area";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Thành viên tổ chức (chủ tổ chức): xem, thêm vai trò, đổi/gỡ vai trò. Backend cho ORG_OWNER gọi POST/DELETE
 * /users/:id/org-roles trong tổ chức đang dùng, nhưng KHÔNG có endpoint tìm người dùng cho vai này (GET /users đòi
 * USERS_VIEW_ALL) nên thêm người mới vào tổ chức chỉ làm được ở khu quản trị hệ thống.
 */
export default function OrgMembersPage() {
  const orgId = useActiveOrgId();
  const currentUserId = useAuthStore((s) => s.user?.id);
  return <OrgMembersPanel orgId={orgId} canAddMember={false} currentUserId={currentUserId} />;
}
