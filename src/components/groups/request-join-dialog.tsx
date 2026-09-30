"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Giới hạn lời nhắn khi xin vào nhóm riêng tư (plan phase 03, khớp Q7). */
export const JOIN_MESSAGE_MAX = 300;

interface RequestJoinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  pending?: boolean;
  /** `message` rỗng được bỏ đi (undefined) để backend không lưu chuỗi trống. */
  onSubmit: (message?: string) => void;
}

export function RequestJoinDialog({ open, onOpenChange, groupName, pending, onSubmit }: RequestJoinDialogProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) setMessage("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Xin tham gia nhóm</DialogTitle>
          <DialogDescription>
            Nhóm &quot;{groupName}&quot; cần được quản trị viên duyệt. Bạn có thể gửi kèm lời nhắn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="join-request-message">Lời nhắn (không bắt buộc)</Label>
          <Textarea
            id="join-request-message"
            value={message}
            maxLength={JOIN_MESSAGE_MAX}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Giới thiệu ngắn về bạn..."
            rows={4}
          />
          <p className="text-right text-xs text-muted-foreground">
            {message.length}/{JOIN_MESSAGE_MAX}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Huỷ
          </Button>
          <Button onClick={() => onSubmit(message.trim() || undefined)} disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Gửi yêu cầu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
