"use client";

import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Clock, User, MapPin, FileText, Users, Video, Radio, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "./week-calendar-grid";

interface ScheduleEventDetailDialogProps {
  event: ScheduleEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG = {
  completed: { label: "DA HOAN THANH", className: "bg-green-100 text-green-700" },
  ongoing: { label: "DANG DIEN RA", className: "bg-red-100 text-red-700" },
  upcoming: { label: "SAP DIEN RA", className: "bg-blue-100 text-blue-700" },
} as const;

const TYPE_CONFIG = {
  video: { label: "Video", icon: Video },
  livestream: { label: "Livestream", icon: Radio },
  hybrid: { label: "Hybrid", icon: Layers },
} as const;

export default function ScheduleEventDetailDialog({
  event,
  open,
  onOpenChange,
}: ScheduleEventDetailDialogProps) {
  if (!event) return null;

  const status = STATUS_CONFIG[event.status];
  const type = TYPE_CONFIG[event.type];
  const TypeIcon = type.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="pr-6">{event.title}</DialogTitle>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={cn("text-[10px]", status.className)}>{status.label}</Badge>
            <Badge variant="outline" className="text-[10px] gap-1">
              <TypeIcon className="w-3 h-3" />
              {type.label}
            </Badge>
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
