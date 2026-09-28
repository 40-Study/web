"use client";

/**
 * Dialog dùng chung cho 2 trang duyệt Phase 3 (/admin/courses, /admin/teacher-applications):
 * xác nhận "Duyệt" và "Từ chối" bắt buộc lý do.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

/** Backend giới hạn lý do từ chối tối đa 1000 ký tự (contract phase3). */
export const REJECT_REASON_MAX_LEN = 1000;

interface ApproveConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ApproveConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận duyệt",
  isPending,
  onConfirm,
  onClose,
}: ApproveConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent data-testid="approve-dialog">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button isLoading={isPending} onClick={onConfirm} data-testid="approve-confirm">
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RejectReasonDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  isPending?: boolean;
  /** Nhận lý do ĐÃ trim — nơi gọi gửi thẳng lên backend. */
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

/**
 * Lý do được giữ trong state nội bộ và reset mỗi lần đóng: component chỉ mount khi `open`
 * (Dialog trả null khi đóng) nên mở lại cho khoá/hồ sơ khác luôn bắt đầu từ ô trống.
 */
export function RejectReasonDialog({
  open,
  title,
  description,
  isPending,
  onSubmit,
  onClose,
}: RejectReasonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <RejectReasonBody
        title={title}
        description={description}
        isPending={isPending}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </Dialog>
  );
}

function RejectReasonBody({
  title,
  description,
  isPending,
  onSubmit,
  onClose,
}: Omit<RejectReasonDialogProps, "open">) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();
  // Chỉ khoảng trắng = rỗng: backend trim rồi mới kiểm (400 "Reason is required").
  const canSubmit = trimmed.length > 0 && trimmed.length <= REJECT_REASON_MAX_LEN;

  return (
    <DialogContent data-testid="reject-dialog">
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
      <div className="mt-4 text-sm">
        <label htmlFor="reject-reason" className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
          Lý do từ chối <span className="text-red-500">*</span>
        </label>
        <textarea
          id="reject-reason"
          data-testid="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={REJECT_REASON_MAX_LEN}
          rows={4}
          placeholder="Nêu rõ lý do để người gửi biết cần sửa gì..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <p className="mt-1 text-right text-xs text-gray-400">
          {reason.length}/{REJECT_REASON_MAX_LEN}
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button
          variant="destructive"
          disabled={!canSubmit}
          isLoading={isPending}
          onClick={() => canSubmit && onSubmit(trimmed)}
          data-testid="reject-submit"
        >
          Gửi từ chối
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
