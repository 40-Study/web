import { format, parseISO } from "date-fns";
import { Clock, User, MapPin, ExternalLink, PlayCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "./week-calendar-grid";

interface ScheduleEventTooltipProps {
  event: ScheduleEvent;
  editable?: boolean;
  onEdit?: (event: ScheduleEvent) => void;
  onViewDetail?: (event: ScheduleEvent) => void;
}

export default function ScheduleEventTooltip({
  event,
  editable = false,
  onEdit,
  onViewDetail,
}: ScheduleEventTooltipProps) {
  return (
    <div
      className={cn(
        "w-72 rounded-xl shadow-2xl border p-4",
        "bg-white dark:bg-gray-900",
        event.status === "completed" && "border-green-200",
        event.status === "ongoing" &&
          "border-red-300 bg-gradient-to-br from-white to-red-50",
        event.status === "upcoming" && "border-blue-200"
      )}
    >
      {/* Title + Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
          {event.title}
        </h3>
        {event.status === "ongoing" && (
          <Badge className="bg-red-500 text-white text-[10px] shrink-0 animate-pulse">
            ĐANG DIỄN RA
          </Badge>
        )}
        {event.status === "completed" && (
          <Badge className="bg-green-100 text-green-700 text-[10px] shrink-0">
            ĐÃ HOÀN THÀNH
          </Badge>
        )}
        {event.status === "upcoming" && (
          <Badge className="bg-blue-100 text-blue-700 text-[10px] shrink-0">
            SẮP DIỄN RA
          </Badge>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1.5 mb-2">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>
            {format(parseISO(event.startTime), "HH:mm")} -{" "}
            {format(parseISO(event.endTime), "HH:mm")}
          </span>
        </div>
        {event.teacher && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span>{event.teacher}</span>
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span>{event.location}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {event.status === "ongoing" && event.meetingUrl && (
          <Button
            size="sm"
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs h-8"
            onClick={() => window.open(event.meetingUrl, "_blank")}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Tham gia
          </Button>
        )}
        {event.status === "upcoming" && !editable && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-8"
            onClick={() => onViewDetail?.(event)}
          >
            Chi tiết
          </Button>
        )}
        {event.status === "completed" && !editable && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-8"
            onClick={() => onViewDetail?.(event)}
          >
            <PlayCircle className="w-3 h-3 mr-1" />
            Xem lại
          </Button>
        )}
        {editable && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-8"
            onClick={() => onEdit?.(event)}
          >
            <Pencil className="w-3 h-3 mr-1" />
            Chỉnh sửa
          </Button>
        )}
      </div>
    </div>
  );
}
