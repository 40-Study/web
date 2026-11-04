"use client";

import { toast } from "sonner";
import { useAssignOrgMemberRole, useRevokeOrgMemberRole } from "@/hooks/queries/use-org-member-roles";
import type { OrgMember, OrgMemberAssignment } from "@/services/organization.service";

/**
 * Các thao tác trên thành viên, dựng trên 2 endpoint backend có sẵn (gán + gỡ). Không có endpoint "đổi vai trò":
 * đổi = gán vai trò mới TRƯỚC (lỗi 409/403 dừng ở đây, người đó chưa mất gì) rồi mới gỡ các vai trò cũ.
 */
export function useOrgMemberActions(orgId: string) {
  const assign = useAssignOrgMemberRole(orgId);
  const revoke = useRevokeOrgMemberRole(orgId);

  const addMember = async (userId: string, roleId: string) => {
    await assign.mutateAsync({ userId, roleId });
    toast.success("Đã thêm thành viên");
  };

  const addRole = async (member: OrgMember, roleId: string) => {
    await assign.mutateAsync({ userId: member.user_id, roleId });
    toast.success("Đã thêm vai trò");
  };

  const changeRole = async (member: OrgMember, roleId: string) => {
    const alreadyHeld = member.assignments.some((a) => a.role_id === roleId);
    if (!alreadyHeld) await assign.mutateAsync({ userId: member.user_id, roleId });
    for (const old of member.assignments.filter((a) => a.role_id !== roleId)) {
      await revoke.mutateAsync({ userId: member.user_id, assignmentId: old.id });
    }
    toast.success("Đã đổi vai trò");
  };

  const removeRole = async (member: OrgMember, assignment: OrgMemberAssignment) => {
    await revoke.mutateAsync({ userId: member.user_id, assignmentId: assignment.id });
    toast.success("Đã gỡ vai trò");
  };

  const removeMember = async (member: OrgMember) => {
    for (const a of member.assignments) {
      await revoke.mutateAsync({ userId: member.user_id, assignmentId: a.id });
    }
    toast.success("Đã gỡ thành viên khỏi tổ chức");
  };

  return { addMember, addRole, changeRole, removeRole, removeMember, busy: assign.isPending || revoke.isPending };
}
