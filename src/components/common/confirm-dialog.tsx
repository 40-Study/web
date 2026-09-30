"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Nút xác nhận đỏ đặc — chỉ dùng cho thao tác xoá/không hoàn tác. */
  destructive?: boolean;
  pending?: boolean;
  /** Bắt người dùng gõ đúng chuỗi này mới cho xác nhận (vd. tên nhóm khi xoá nhóm). */
  requireText?: string;
  onConfirm: () => void;
}

/** Hộp thoại xác nhận dùng chung cho rời nhóm, xoá nhóm, gỡ/cấm thành viên, huỷ kết bạn, chặn. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Huỷ",
  destructive,
  pending,
  requireText,
  onConfirm,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");

  // Mở lại hộp thoại không được giữ chuỗi đã gõ của lần trước.
  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const matches = requireText === undefined || typed.trim() === requireText.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {requireText !== undefined && (
          <div className="space-y-2">
            <Label htmlFor="confirm-dialog-text">
              Nhập <span className="font-semibold">{requireText}</span> để xác nhận
            </Label>
            <Input
              id="confirm-dialog-text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={pending || !matches}
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
