"use client";

import { X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOrgRoleLabel } from "@/lib/role-labels";
import type { OrgMember, OrgMemberAssignment } from "@/services/organization.service";

interface OrgMemberRowProps {
  member: OrgMember;
  /** Chính người đang đăng nhập: không cho tự đổi/gỡ vai trò của mình (tránh tự khoá quyền quản lý tổ chức). */
  isSelf: boolean;
  disabled: boolean;
  onAddRole: (member: OrgMember) => void;
  onChangeRole: (member: OrgMember) => void;
  onRemoveRole: (member: OrgMember, assignment: OrgMemberAssignment) => void;
  onRemoveMember: (member: OrgMember) => void;
}

const SELF_HINT = "Không thể tự thay đổi vai trò của chính mình";

export function OrgMemberRow({
  member,
  isSelf,
  disabled,
  onAddRole,
  onChangeRole,
  onRemoveRole,
  onRemoveMember,
}: OrgMemberRowProps) {
  const lock = disabled || isSelf;
  return (
    <li className="flex flex-wrap items-center gap-3 p-4">
      <Avatar src={member.avatar_url} fallback={member.name} size="sm" />
      <div className="min-w-0 flex-1 basis-48">
        <p className="truncate font-medium">
          {member.name}
          {isSelf && <span className="ml-2 text-xs font-normal text-muted-foreground">(bạn)</span>}
        </p>
        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {member.assignments.map((a) => (
          <Badge key={a.id} variant="secondary" title={a.name} className="gap-1">
            {getOrgRoleLabel(a.name)}
            <button
              type="button"
              aria-label={`Gỡ vai trò ${getOrgRoleLabel(a.name)} của ${member.name}`}
              title={isSelf ? SELF_HINT : "Gỡ vai trò này"}
              disabled={lock}
              onClick={() => onRemoveRole(member, a)}
              className="rounded-full p-0.5 hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={disabled} onClick={() => onAddRole(member)}>
          Thêm vai trò
        </Button>
        <Button size="sm" variant="outline" disabled={lock} title={isSelf ? SELF_HINT : undefined} onClick={() => onChangeRole(member)}>
          Đổi vai trò
        </Button>
        <Button
          size="sm"
          variant="destructiveGhost"
          disabled={lock}
          title={isSelf ? SELF_HINT : undefined}
          aria-label={`Gỡ ${member.name} khỏi tổ chức`}
          onClick={() => onRemoveMember(member)}
        >
          Gỡ khỏi tổ chức
        </Button>
      </div>
    </li>
  );
}
