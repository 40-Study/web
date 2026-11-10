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
 * Xác nhận xoá tổ chức (QA-C-20). Backend xoá tổ chức xong thì tăng user_version của MỌI thành viên
 * (organization_service.go DeleteOrganization), nên mọi phiên của họ bị thu hồi. Admin hệ thống tạo tổ chức là
 * thành chủ tổ chức đó, nên admin xoá tổ chức của chính mình cũng bị đăng xuất khỏi mọi thiết bị. Hộp thoại đọc
 * danh sách thành viên để báo trước điều này thay vì để người dùng văng về /login ngay sau toast thành công.
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
                {memberCount} thành viên sẽ mất vai trò trong tổ chức và bị đăng xuất khỏi mọi thiết bị để áp dụng thay đổi.
              </span>
            )
          )}
          {isSelfMember && (
            <span role="note" className="mt-2 block font-medium text-amber-700 dark:text-amber-400">
              Bạn đang là thành viên của tổ chức này, nên bạn cũng sẽ bị đăng xuất ngay sau khi xoá và phải đăng nhập lại.
            </span>
          )}
          {members.isError && (
            <span className="mt-2 block text-muted-foreground">
              Không tải được danh sách thành viên. Nếu bạn là thành viên của tổ chức này, bạn sẽ bị đăng xuất sau khi xoá.
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
