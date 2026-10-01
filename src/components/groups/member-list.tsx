"use client";

import Link from "next/link";
import { useState } from "react";
import { Ban, UserMinus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QueryState } from "@/components/common/query-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  useBanMember,
  useGroupMembers,
  useRemoveMember,
  useUpdateMemberRole,
} from "@/hooks/queries/use-groups";
import { ApiError } from "@/lib/errors";
import type { Group, GroupMember } from "@/services/group.service";
import { formatVnDate, memberDisplayName, roleLabel } from "./group-labels";
import { assignableRoles, canManageMember } from "./group-permissions";
import { PaginationControls } from "@/components/common/pagination-controls";

export const MEMBERS_PAGE_SIZE = 20;

/** Người ngoài xem thành viên nhóm PRIVATE nhận 403 ERR_FORBIDDEN (nhóm SECRET thì 404, xử lý ở trang). */
export const MEMBERS_FORBIDDEN_MESSAGE = "Chỉ thành viên mới xem được danh sách thành viên của nhóm riêng tư này.";

function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

interface MemberListProps {
  group: Group;
  viewerId?: string;
  /** true ở tab Quản lý: hiện đổi vai / gỡ / cấm theo quyền. */
  manage?: boolean;
}

type Pending = { kind: "remove" | "ban"; member: GroupMember } | null;

export function MemberList({ group, viewerId, manage = false }: MemberListProps) {
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<Pending>(null);
  const { data, isLoading, isError, error, refetch } = useGroupMembers(group.id, {
    page,
    limit: MEMBERS_PAGE_SIZE,
  });
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const banMember = useBanMember();

  const members = data?.members ?? [];
  const forbidden = isError && isForbidden(error);
  const closePending = () => setPending(null);

  if (forbidden) {
    // Thử lại vô ích (quyền không đổi sau một lần bấm), nên không hiện nút Thử lại.
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground" role="alert">
        {MEMBERS_FORBIDDEN_MESSAGE}
      </Card>
    );
  }

  return (
    <div>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={members.length === 0}
        emptyTitle="Chưa có thành viên"
        onRetry={() => refetch()}
      >
        <Card className="divide-y">
          {members.map((member) => {
            const roles = manage ? assignableRoles(group.my_role, member, viewerId) : [];
            const canAct = manage && canManageMember(group.my_role, member, viewerId);
            return (
              <div key={member.id} className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
                <Avatar src={member.avatar_url} fallback={memberDisplayName(member)} size="md" />
                <div className="min-w-0 flex-1">
                  <Link href={`/profile/${member.user_id}`} className="block truncate font-medium hover:text-primary">
                    {memberDisplayName(member)}
                    {member.user_id === viewerId && <span className="text-muted-foreground"> (Bạn)</span>}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatVnDate(member.joined_at) ? `Tham gia ${formatVnDate(member.joined_at)}` : " "}
                  </p>
                </div>
                <Badge variant={member.role === "OWNER" ? "default" : "outline"}>{roleLabel(member.role)}</Badge>

                {canAct && (
                  <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                    {roles.length > 0 && (
                      <select
                        aria-label={`Đổi vai trò của ${memberDisplayName(member)}`}
                        className="h-9 rounded-lg border border-slate-200 bg-background px-2 text-sm dark:border-slate-700"
                        value=""
                        disabled={updateRole.isPending}
                        onChange={(e) => {
                          if (e.target.value)
                            updateRole.mutate({ groupId: group.id, userId: member.user_id, role: e.target.value });
                        }}
                      >
                        <option value="">Đổi vai trò…</option>
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {roleLabel(r)}
                          </option>
                        ))}
                      </select>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setPending({ kind: "remove", member })}>
                      <UserMinus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Gỡ
                    </Button>
                    <Button variant="destructiveGhost" size="sm" onClick={() => setPending({ kind: "ban", member })}>
                      <Ban className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Cấm
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
        <PaginationControls
          page={page}
          totalCount={data?.total_count ?? 0}
          pageSize={MEMBERS_PAGE_SIZE}
          onPageChange={setPage}
        />
      </QueryState>

      {pending && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && closePending()}
          title={pending.kind === "remove" ? "Gỡ thành viên khỏi nhóm?" : "Cấm thành viên?"}
          description={
            pending.kind === "remove"
              ? `${memberDisplayName(pending.member)} sẽ rời khỏi nhóm nhưng vẫn có thể xin vào lại.`
              : `${memberDisplayName(pending.member)} sẽ bị đưa khỏi nhóm và không thể tham gia lại cho tới khi được bỏ cấm.`
          }
          confirmLabel={pending.kind === "remove" ? "Gỡ khỏi nhóm" : "Cấm"}
          destructive
          pending={removeMember.isPending || banMember.isPending}
          onConfirm={() => {
            const vars = { groupId: group.id, userId: pending.member.user_id };
            (pending.kind === "remove" ? removeMember : banMember).mutate(vars, { onSuccess: closePending });
          }}
        />
      )}
    </div>
  );
}
