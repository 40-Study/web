"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface NotificationRecipient {
  id: string;
  name: string;
  phone?: string;
}

interface TeacherNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: NotificationRecipient[];
  contextLabel?: string;
}

const UNAVAILABLE_REASON =
  "Hệ thống hiện chưa cho phép giáo viên gửi thông báo tới học viên.";

/**
 * Backend chỉ có POST /notifications/send (quyền quản trị hệ thống), chưa có API cho giáo viên.
 * Hộp thoại này nói rõ điều đó thay vì giả lập việc gửi.
 */
export default function TeacherNotificationDialog({
  open,
  onOpenChange,
  recipients,
  contextLabel,
}: TeacherNotificationDialogProps) {
  const recipientLabel = useMemo(() => {
    if (recipients.length === 0) return "Chưa chọn người nhận";
    if (recipients.length === 1) return recipients[0].name;
    return `${recipients.length} học viên`;
  }, [recipients]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gửi thông báo</DialogTitle>
          <DialogDescription>
            {contextLabel ? `${contextLabel}. ` : ""}Người nhận: <b>{recipientLabel}</b>
          </DialogDescription>
        </DialogHeader>

        <div
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          <p className="font-medium">Tính năng chưa khả dụng</p>
          <p className="mt-1">
            {UNAVAILABLE_REASON} Vui lòng liên hệ quản trị viên nếu cần thông báo tới học viên hoặc
            phụ huynh.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button disabled title={UNAVAILABLE_REASON}>
            Gửi thông báo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
