"use client";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useDeleteOrganization } from "@/hooks/queries/use-admin";
import { useOrgMembers } from "@/hooks/queries/use-org-area";
import { getErrorMessage } from "@/lib/error-messages";
import type { Organization } from "@/services/organization.service";
import { useState } from "react";

interface DeleteOrganizationDialogProps {
  org: Organization | null;
  currentUserId?: string;
  onClose: () => void;
  onDeleted: (orgId: string) => void;
}

/**
 * Xác nhận xoá tổ chức (QA-C-20). Từ backend PR #144, xoá tổ chức KHÔNG còn thu hồi phiên của ai: backend chỉ gỡ
 * vai trò tổ chức của mọi thành viên trong cùng transaction (organization_service.go DeleteOrganization). Hộp thoại
 * đọc danh sách thành viên để báo trước bao nhiêu người mất quyền trong tổ chức này, kể cả chính người đang thao tác
 * (admin tạo tổ chức là thành chủ tổ chức đó).
 */
export function DeleteOrganizationDialog({ org, currentUserId, onClose, onDeleted }: DeleteOrganizationDialogProps) {
  const deleteOrg = useDeleteOrganization();
  const members = useOrgMembers(org?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const memberCount = members.data?.length ?? 0;
  const isSelfMember = !!currentUserId && !!members.data?.some((m) => m.user_id === currentUserId);

  const close = () => {
    setError(null);
    onClose();
  };

  const confirm = async () => {
    if (!org) return;
    setError(null);
    try {
      await deleteOrg.mutateAsync(org.id);
      onDeleted(org.id);
      close();
    } catch (e) {
      setError(getErrorMessage(e, "Không xoá được tổ chức, thử lại sau."));
    }
  };

  return (
    <ConfirmDialog
      open={!!org}
      onOpenChange={(open) => !open && close()}
      title={`Xoá tổ chức "${org?.name ?? ""}"?`}
      description={
        <>
          <span className="block">Hành động này không thể hoàn tác.</span>
          {members.isLoading ? (
            <span className="mt-2 block text-muted-foreground">Đang kiểm tra thành viên của tổ chức…</span>
          ) : (
            memberCount > 0 && (
              <span className="mt-2 block">
                {memberCount} thành viên sẽ mất vai trò và quyền trong tổ chức này.
              </span>
            )
          )}
          {isSelfMember && (
            <span role="note" className="mt-2 block font-medium text-amber-700 dark:text-amber-400">
              Bạn đang là thành viên của tổ chức này, nên bạn cũng mất vai trò trong tổ chức này. Vai trò hệ thống của bạn giữ nguyên.
            </span>
          )}
          {members.isError && (
            <span className="mt-2 block text-muted-foreground">
              Không tải được danh sách thành viên. Mọi thành viên của tổ chức này sẽ mất vai trò trong tổ chức sau khi xoá.
            </span>
          )}
          {error && (
            <span role="alert" className="mt-2 block text-red-600">
              {error}
            </span>
          )}
        </>
      }
      confirmLabel="Xoá tổ chức"
      destructive
      pending={deleteOrg.isPending}
      onConfirm={confirm}
    />
  );
}
