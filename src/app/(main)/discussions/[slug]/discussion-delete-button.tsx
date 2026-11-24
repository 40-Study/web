"use client";

/**
 * Nút "Xoá" cho tác giả bài viết / bình luận diễn đàn, luôn hỏi xác nhận trước (QA4 S5).
 */

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DiscussionDeleteButtonProps {
  /** "bài viết" hoặc "bình luận" — dùng trong chữ của nút và hộp xác nhận. */
  target: "bài viết" | "bình luận";
  onConfirm: () => Promise<unknown>;
  isPending?: boolean;
  className?: string;
}

export function DiscussionDeleteButton({ target, onConfirm, isPending = false, className }: DiscussionDeleteButtonProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // Nơi gọi đã báo lỗi; giữ hộp mở để người dùng thử lại hoặc huỷ.
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors", className)}
      >
        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
        Xoá {target}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá {target} này?</DialogTitle>
            <DialogDescription>
              {target === "bài viết"
                ? "Bài viết và các bình luận trong đó sẽ không còn hiển thị trên diễn đàn. Không thể hoàn tác."
                : "Bình luận sẽ không còn hiển thị. Không thể hoàn tác."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={() => void handleConfirm()} isLoading={isPending} loadingText="Đang xoá…">
              Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
