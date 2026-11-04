"use client";

/** Hộp xác nhận trước khi gửi duyệt khoá học: hiện checklist (ảnh bìa, mô tả, bài học), thiếu mục nào thì khoá nút gửi. */

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { missingChecklistItems, type SubmitChecklistItem } from "@/lib/course-submit-checklist";

interface SubmitReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SubmitChecklistItem[];
  /** "Gửi duyệt" hoặc "Gửi duyệt lại": dùng làm tiêu đề và nhãn nút xác nhận. */
  actionLabel: string;
  isPending: boolean;
  onConfirm: () => void;
}

export function SubmitReviewDialog({ open, onOpenChange, items, actionLabel, isPending, onConfirm }: SubmitReviewDialogProps) {
  const missing = missingChecklistItems(items);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="submit-review-dialog">
        <DialogTitle>{actionLabel} khoá học?</DialogTitle>
        <DialogDescription className="mt-1">
          Quản trị viên sẽ xem xét khoá học. Trong lúc chờ duyệt, nội dung khoá bị khoá chỉnh sửa (bạn có thể rút yêu cầu).
        </DialogDescription>
        <ul className="mt-4 space-y-2" aria-label="Kiểm tra trước khi gửi duyệt">
          {items.map((item) => (
            <li key={item.id} data-testid={`submit-check-${item.id}`} data-done={String(item.done ?? "unknown")} className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  item.done === false ? "bg-red-100 text-red-600" : item.done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                )}
                aria-hidden="true"
              >
                {item.done === false ? <X className="h-3 w-3" /> : item.done ? <Check className="h-3 w-3" /> : null}
              </span>
              <span className={item.done === false ? "text-red-700" : undefined}>
                {item.label}
                {item.hint && <span className="text-muted-foreground"> ({item.hint})</span>}
                {item.done === false && <span className="sr-only"> (chưa có)</span>}
              </span>
            </li>
          ))}
        </ul>
        {missing.length > 0 && (
          <p role="alert" data-testid="submit-review-missing" className="mt-3 text-sm text-red-700">
            Còn thiếu: {missing.map((m) => m.label.toLowerCase()).join(", ")}. Bổ sung (Sửa thông tin hoặc thêm bài học) rồi gửi duyệt.
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Để sau
          </Button>
          <Button onClick={onConfirm} isLoading={isPending} disabled={missing.length > 0 || isPending} data-testid="confirm-submit-review">
            {actionLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
