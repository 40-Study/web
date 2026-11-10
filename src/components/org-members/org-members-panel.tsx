"use client";

import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { QueryState } from "@/components/common/query-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAssignableOrgRoles } from "@/hooks/queries/use-org-member-roles";
import { useOrgMembers } from "@/hooks/queries/use-org-area";
import { getErrorMessage } from "@/lib/error-messages";
import { getOrgRoleLabel } from "@/lib/role-labels";
import { isUncertainOutcomeError, reconcileUncertainOutcome, uncertainOutcomeDescription } from "@/lib/uncertain-mutation";
import type { OrgMember, OrgMemberAssignment } from "@/services/organization.service";
import { AddMemberDialog } from "./add-member-dialog";
import { MemberRoleDialog } from "./member-role-dialog";
import { OrgMemberRow } from "./org-member-row";
import { isRemovalApplied, useOrgMemberActions } from "./use-org-member-actions";

interface OrgMembersPanelProps {
  orgId: string;
  canAddMember: boolean;
  /**
   * Cách tìm người khi thêm: "directory" (quản trị hệ thống, GET /users) hoặc "email" (chủ tổ chức, tra đúng email
   * qua user-lookup của tổ chức — QA-C-01).
   */
  memberLookup?: "directory" | "email";
  currentUserId?: string;
}

type Confirm =
  | { kind: "role"; member: OrgMember; assignment: OrgMemberAssignment }
  | { kind: "member"; member: OrgMember };

/** Danh sách + quản lý thành viên của một tổ chức; dùng chung cho /admin/organizations và /org/members. */
export function OrgMembersPanel({ orgId, canAddMember, memberLookup = "directory", currentUserId }: OrgMembersPanelProps) {
  const members = useOrgMembers(orgId);
  const roles = useAssignableOrgRoles(orgId);
  const actions = useOrgMemberActions(orgId);

  const [keyword, setKeyword] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addRoleFor, setAddRoleFor] = useState<OrgMember | null>(null);
  const [changeFor, setChangeFor] = useState<OrgMember | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const confirmBusy = actions.busy || reconciling;

  const data = useMemo(() => members.data ?? [], [members.data]);
  const orgRoles = useMemo(() => roles.data ?? [], [roles.data]);
  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return q ? data.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) : data;
  }, [data, keyword]);
  const memberIds = useMemo(() => new Set(data.map((m) => m.user_id)), [data]);

  const closeConfirm = () => {
    setConfirm(null);
    setConfirmError(null);
  };

  const runConfirm = async () => {
    if (!confirm || confirmBusy) return;
    setConfirmError(null);
    try {
      if (confirm.kind === "role") await actions.removeRole(confirm.member, confirm.assignment);
      else await actions.removeMember(confirm.member);
      closeConfirm();
    } catch (e) {
      if (!isUncertainOutcomeError(e)) {
        setConfirmError(getErrorMessage(e, "Không thể gỡ, thử lại sau."));
        return;
      }
      // QA-C-16: timeout nhưng server thường đã gỡ xong. Tải lại danh sách và đối chiếu thay vì báo lỗi.
      setReconciling(true);
      const result = await reconcileUncertainOutcome(async () => {
        const fresh = await members.refetch();
        if (fresh.isError) throw fresh.error;
        return isRemovalApplied(confirm.kind === "role" ? confirm : { member: confirm.member }, fresh.data ?? []);
      });
      setReconciling(false);
      if (result === "confirmed") {
        toast.success(confirm.kind === "role" ? "Đã gỡ vai trò" : "Đã gỡ thành viên khỏi tổ chức");
        closeConfirm();
        return;
      }
      setConfirmError(`Chưa rõ kết quả. ${uncertainOutcomeDescription("gỡ")}`);
    }
  };

  const lastRole = confirm?.kind === "role" && confirm.member.assignments.length === 1;
  const confirmTitle =
    confirm?.kind === "role"
      ? `Gỡ vai trò "${getOrgRoleLabel(confirm.assignment.name)}" của ${confirm.member.name}?`
      : `Gỡ ${confirm?.member.name ?? ""} khỏi tổ chức?`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold">Thành viên ({data.length})</h2>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên hoặc email"
            aria-label="Tìm thành viên"
            className="w-full sm:w-72"
          />
          {canAddMember && (
            <Button onClick={() => setAddOpen(true)} disabled={orgRoles.length === 0}>
              <UserPlus className="mr-1 h-4 w-4" aria-hidden="true" />
              Thêm thành viên
            </Button>
          )}
        </div>
      </div>
      {!canAddMember && (
        <p className="text-sm text-muted-foreground">
          Muốn thêm người mới vào tổ chức, hãy liên hệ quản trị viên hệ thống. Bạn vẫn đổi hoặc gỡ vai trò của các thành viên hiện có ở đây.
        </p>
      )}
      {/* QA-C-01: trước đây nút "Thêm thành viên" bị khoá im lặng khi tổ chức chưa có vai nào. */}
      {canAddMember && roles.isSuccess && orgRoles.length === 0 && (
        <p role="note" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          Tổ chức này chưa có vai trò nào để gán nên chưa thêm được thành viên. Tổ chức tạo trước khi có bộ vai mặc định
          (Chủ tổ chức, Giảng viên, Học viên) cần quản trị hệ thống bổ sung vai trò trước.
        </p>
      )}
      {roles.isError && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(roles.error, "Không tải được danh sách vai trò của tổ chức.")}
        </p>
      )}
      <QueryState
        isLoading={members.isLoading}
        isError={members.isError}
        error={members.error}
        onRetry={() => members.refetch()}
        isEmpty={filtered.length === 0}
        emptyTitle={keyword ? "Không có thành viên phù hợp" : "Tổ chức chưa có thành viên"}
        emptyDescription={keyword ? "Thử từ khoá khác." : undefined}
      >
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {filtered.map((m) => (
            <OrgMemberRow
              key={m.user_id}
              member={m}
              isSelf={!!currentUserId && m.user_id === currentUserId}
              disabled={actions.busy}
              onAddRole={setAddRoleFor}
              onChangeRole={setChangeFor}
              onRemoveRole={(member, assignment) => setConfirm({ kind: "role", member, assignment })}
              onRemoveMember={(member) => setConfirm({ kind: "member", member })}
            />
          ))}
        </ul>
      </QueryState>

      <AddMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        roles={orgRoles}
        memberIds={memberIds}
        onSubmit={actions.addMember}
        lookup={memberLookup}
        orgId={orgId}
      />
      <MemberRoleDialog
        open={!!addRoleFor}
        onOpenChange={(o) => !o && setAddRoleFor(null)}
        title={`Thêm vai trò cho ${addRoleFor?.name ?? ""}`}
        description="Người này giữ thêm vai trò đã chọn, các vai trò hiện có được giữ nguyên."
        confirmLabel="Thêm vai trò"
        roles={orgRoles.filter((r) => !addRoleFor?.assignments.some((a) => a.role_id === r.id))}
        onSubmit={(roleId) => actions.addRole(addRoleFor as OrgMember, roleId)}
      />
      <MemberRoleDialog
        open={!!changeFor}
        onOpenChange={(o) => !o && setChangeFor(null)}
        title={`Đổi vai trò của ${changeFor?.name ?? ""}`}
        description="Vai trò mới được gán trước, sau đó các vai trò hiện tại khác được gỡ."
        confirmLabel="Đổi vai trò"
        roles={orgRoles}
        onSubmit={(roleId) => actions.changeRole(changeFor as OrgMember, roleId)}
      />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && !confirmBusy && closeConfirm()}
        title={confirmTitle}
        description={
          <>
            {confirm?.kind === "member" || lastRole
              ? "Người này sẽ không còn là thành viên của tổ chức và bị đăng xuất để áp dụng thay đổi."
              : "Người này bị đăng xuất để áp dụng thay đổi."}
            {confirmError && (
              <span role="alert" className="mt-2 block text-red-600">
                {confirmError}
              </span>
            )}
          </>
        }
        confirmLabel="Gỡ"
        destructive
        pending={confirmBusy}
        onConfirm={runConfirm}
      />
    </div>
  );
}
