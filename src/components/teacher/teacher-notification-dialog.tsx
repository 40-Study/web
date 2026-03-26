"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function TeacherNotificationDialog({
  open,
  onOpenChange,
  recipients,
  contextLabel,
}: TeacherNotificationDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState("in-app");
  const [priority, setPriority] = useState("normal");
  const [sendMode, setSendMode] = useState("now");
  const [scheduledAt, setScheduledAt] = useState("");

  const recipientLabel = useMemo(() => {
    if (recipients.length === 0) return "Chưa chọn người nhận";
    if (recipients.length === 1) return recipients[0].name;
    return `${recipients.length} học viên`;
  }, [recipients]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setChannel("in-app");
    setPriority("normal");
    setSendMode("now");
    setScheduledAt("");
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || recipients.length === 0) return;
    if (sendMode === "schedule" && !scheduledAt) return;

    const channelLabel = channel === "in-app" ? "Trong ứng dụng" : channel === "sms" ? "SMS" : "Email";
    const whenLabel = sendMode === "now" ? "gửi ngay" : `lên lịch: ${scheduledAt}`;

    window.alert(
      `Đã tạo thông báo thành công\n\n` +
        `Ngữ cảnh: ${contextLabel || "Quản lý học viên"}\n` +
        `Người nhận: ${recipientLabel}\n` +
        `Kênh: ${channelLabel}\n` +
        `Mức độ: ${priority}\n` +
        `Thời gian: ${whenLabel}\n\n` +
        `Tiêu đề: ${title.trim()}\n` +
        `Nội dung: ${content.trim()}`
    );

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gửi thông báo chi tiết</DialogTitle>
          <DialogDescription>
            Soạn tiêu đề, nội dung, chọn kênh gửi và thời điểm gửi. Người nhận: <b>{recipientLabel}</b>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notify-title">Tiêu đề thông báo *</Label>
            <Input
              id="notify-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Nhắc lịch học tuần này"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notify-content">Nội dung chi tiết *</Label>
            <Textarea
              id="notify-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung muốn gửi cho học viên/phụ huynh..."
              rows={6}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Kênh gửi</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-app">Trong ứng dụng</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mức độ</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="normal">Bình thường</SelectItem>
                  <SelectItem value="high">Khẩn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Thời điểm gửi</Label>
              <Select value={sendMode} onValueChange={setSendMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Gửi ngay</SelectItem>
                  <SelectItem value="schedule">Lên lịch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {sendMode === "schedule" && (
            <div className="space-y-2">
              <Label htmlFor="notify-schedule">Ngày giờ gửi *</Label>
              <Input
                id="notify-schedule"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || recipients.length === 0 || (sendMode === "schedule" && !scheduledAt)}
          >
            Gửi thông báo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
