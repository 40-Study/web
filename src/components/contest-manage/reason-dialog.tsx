"use client";

/**
 * Hộp thoại nhập lý do (từ chối / huỷ cuộc thi). Backend trim rồi kiểm 1..1000 ký tự
 * (REASON_REQUIRED / REASON_TOO_LONG). Dialog dùng chung `review-dialogs.tsx` gắn cứng nhãn
 * "Lý do từ chối" nên không dùng lại được cho "huỷ".
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

export const CONTEST_REASON_MAX_LEN = 1000;

interface ReasonDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  fieldLabel: string;
  submitLabel: string;
  isPending?: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

export function ReasonDialog({ open, onClose, ...rest }: ReasonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {/* Body chỉ mount khi mở → mỗi lần mở bắt đầu từ ô trống. */}
      {open && <ReasonBody onClose={onClose} {...rest} />}
    </Dialog>
  );
}

function ReasonBody({
  title,
  description,
  fieldLabel,
  submitLabel,
  isPending,
  onSubmit,
  onClose,
}: Omit<ReasonDialogProps, "open">) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= CONTEST_REASON_MAX_LEN;

  return (
    <DialogContent data-testid="reason-dialog">
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
      <div className="mt-4 text-sm">
        <label htmlFor="contest-reason" className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
          {fieldLabel} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="contest-reason"
          data-testid="reason-input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={CONTEST_REASON_MAX_LEN}
          rows={4}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <p className="mt-1 text-right text-xs text-gray-400">
          {reason.length}/{CONTEST_REASON_MAX_LEN}
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
        <Button
          variant="destructive"
          disabled={!canSubmit}
          isLoading={isPending}
          onClick={() => canSubmit && onSubmit(trimmed)}
          data-testid="reason-submit"
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
