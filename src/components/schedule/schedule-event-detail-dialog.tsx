"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Ban, Clock, User, MapPin, Building2, FileText, Users, Video, Radio, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isVnSessionUpcoming } from "@/lib/vn-datetime";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "./week-calendar-grid";

interface ScheduleEventDetailDialogProps {
  event: ScheduleEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Có thì buổi học cụ thể chưa bắt đầu (`event.cancelTarget`) hiện nút "Huỷ buổi". Trang giảng viên truyền vào; trang
   * phụ huynh/học viên không truyền nên không có nút.
   */
  onCancelSession?: (event: ScheduleEvent) => void;
}

const STATUS_CONFIG = {
  completed: { label: "ĐÃ HOÀN THÀNH", className: "bg-green-100 text-green-700" },
  // Q5-PG-08: buổi đã kết thúc nhưng server vẫn để "sắp diễn ra" (chưa ai đánh dấu hoàn thành).
  ended: { label: "ĐÃ DIỄN RA", className: "bg-gray-100 text-gray-700" },
  ongoing: { label: "ĐANG DIỄN RA", className: "bg-red-100 text-red-700" },
  upcoming: { label: "SẮP DIỄN RA", className: "bg-blue-100 text-blue-700" },
} as const;

const TYPE_CONFIG = {
  video: { label: "Video", icon: Video },
  livestream: { label: "Livestream", icon: Radio },
  hybrid: { label: "Kết hợp", icon: Layers },
} as const;

/**
 * Q5-PG-08: trạng thái hiển thị. Buổi cụ thể còn "upcoming" theo server nhưng giờ kết thúc đã qua thì là "đã diễn
 * ra", không phải "SẮP DIỄN RA". Lịch lặp tuần chưa trải thành ngày (`weekly`) giữ ngày giả 2000-01-01 nên bỏ qua.
 */
function displayStatus(event: ScheduleEvent, now: number): keyof typeof STATUS_CONFIG {
  if (event.status !== "upcoming" || event.weekly) return event.status;
  const end = parseISO(event.endTime).getTime();
  return Number.isFinite(end) && end < now ? "ended" : "upcoming";
}

export default function ScheduleEventDetailDialog({
  event,
  open,
  onOpenChange,
  onCancelSession,
}: ScheduleEventDetailDialogProps) {
  if (!event) return null;

  const status = STATUS_CONFIG[displayStatus(event, Date.now())];
  const type = TYPE_CONFIG[event.type];
  const TypeIcon = type.icon;
  // Buổi học của lớp luôn mang `type: "video"` cố định nên chip "Video" sai nghĩa; chỉ livestream mới có loại thật.
  const showType = !event.kind || event.kind === "livestream";
  // Backend không tự chuyển buổi sang "đã kết thúc" và từ chối huỷ buổi đã bắt đầu (422), nên chỉ mời huỷ khi CHỨNG
  // MINH được buổi còn ở tương lai (cùng quy tắc `isVnSessionUpcoming` với danh sách buổi trong trang lớp).
  const target = event.cancelTarget;
  const canCancel = !!onCancelSession && !!target && isVnSessionUpcoming(target.date, target.startTime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="pr-6">{event.title}</DialogTitle>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={cn("text-[10px]", status.className)}>{status.label}</Badge>
            {showType && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <TypeIcon className="w-3 h-3" />
                {type.label}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {/* Date & Time */}
          <DetailRow icon={Clock}>
            <span className="font-medium">
              {format(parseISO(event.startTime), "EEEE, dd/MM/yyyy", { locale: vi })}
            </span>
            <span className="text-gray-500 ml-1">
              {format(parseISO(event.startTime), "HH:mm")} -{" "}
              {format(parseISO(event.endTime), "HH:mm")}
            </span>
          </DetailRow>

          {/* Teacher */}
          {event.teacher && (
            <DetailRow icon={User}>
              <span>{event.teacher}</span>
            </DetailRow>
          )}

          {/* Nguồn lớp: cá nhân hay tổ chức */}
          {event.kind && event.kind !== "livestream" && event.tag && (
            <DetailRow icon={Building2}>
              <span>{event.tag}</span>
            </DetailRow>
          )}

          {/* Location */}
          {event.location && (
            <DetailRow icon={MapPin}>
              <span>{event.location}</span>
            </DetailRow>
          )}

          {/* Participants */}
          {event.participants && (
            <DetailRow icon={Users}>
              <span>{event.participants} thanh vien</span>
            </DetailRow>
          )}

          {/* Description */}
          {event.description && (
            <DetailRow icon={FileText}>
              <span className="text-gray-600 dark:text-gray-300">{event.description}</span>
            </DetailRow>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onCancelSession?.(event)}
            >
              <Ban className="mr-1 h-4 w-4" aria-hidden="true" /> Huỷ buổi
            </Button>
          )}
          {event.meetingUrl?.startsWith("/rooms/") && event.status === "ongoing" && <Link href={event.meetingUrl} prefetch={false} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"><Radio className="h-4 w-4" />Vào lớp học</Link>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Reusable detail row with icon */
function DetailRow({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
