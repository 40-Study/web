"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Hộp xác nhận trước khi huỷ liên kết phụ huynh-học sinh (thao tác cắt quyền xem ngay lập tức). */
export function ConfirmUnlinkDialog({
  open,
  onOpenChange,
  name,
  description,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  description: string;
  isPending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Huỷ liên kết với {name}?</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Giữ liên kết
          </Button>
          <Button variant="destructive" onClick={onConfirm} isLoading={isPending} loadingText="Đang huỷ...">
            Huỷ liên kết
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
