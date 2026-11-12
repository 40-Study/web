"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/error-messages";
import type { OrgRoleListItem } from "@/services/role.service";
import { RoleSelect } from "./role-select";

interface MemberRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  roles: OrgRoleListItem[];
  /** Gọi khi bấm xác nhận; throw để hiện lỗi (vd. 409 gán trùng) NGAY trong hộp thoại và giữ nó mở. */
  onSubmit: (roleId: string) => Promise<void>;
}

/** Hộp thoại chọn một vai trò rồi xác nhận — dùng cho "Thêm vai trò" và "Đổi vai trò" của một thành viên. */
export function MemberRoleDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  roles,
  onSubmit,
}: MemberRoleDialogProps) {
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setRoleId("");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      await onSubmit(roleId);
      onOpenChange(false);
    } catch (e) {
      setError(getErrorMessage(e, "Không thể cập nhật vai trò, thử lại sau."));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="mt-2">
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không còn vai trò nào để chọn.</p>
          ) : (
            <RoleSelect roles={roles} value={roleId} onChange={setRoleId} ariaLabel="Vai trò" />
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={!roleId || pending} isLoading={pending}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
