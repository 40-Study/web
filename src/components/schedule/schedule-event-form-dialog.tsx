"use client";

import { useState, useEffect } from "react";
import { format, setHours, setMinutes } from "date-fns";
import { vi } from "date-fns/locale";
import { Clock, MapPin, Video, Radio, Trash2, RepeatIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "./week-calendar-grid";
import RecurrenceSelector, {
  type RecurrenceConfig,
  DEFAULT_RECURRENCE,
  buildRRule,
} from "./recurrence-selector";

export interface EventFormData {
  title: string;
  type: "video" | "livestream" | "hybrid";
  startTime: string;
  endTime: string;
  location: string;
  meetingUrl: string;
  description: string;
  recurrenceRule?: string;
}

interface ScheduleEventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing event to edit. If null, dialog is in "create" mode. */
  event: ScheduleEvent | null;
  /** Pre-filled date/hour when clicking empty cell */
  defaultDate?: Date;
  defaultHour?: number;
  /** Pre-filled end time string "HH:mm" from drag selection */
  defaultEndTime?: string;
  onSave: (data: EventFormData, eventId?: string) => void;
  onDelete?: (eventId: string) => void;
}

const EVENT_TYPES = [
  { value: "video", label: "Video bài giảng", icon: Video, color: "text-blue-500" },
  { value: "livestream", label: "Livestream", icon: Radio, color: "text-red-500" },
  { value: "hybrid", label: "Hybrid", icon: Video, color: "text-purple-500" },
] as const;

export default function ScheduleEventFormDialog({
  open,
  onOpenChange,
  event,
  defaultDate,
  defaultHour,
  defaultEndTime,
  onSave,
  onDelete,
}: ScheduleEventFormDialogProps) {
  const isEditing = !!event;

  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventFormData["type"]>("video");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:30");
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [description, setDescription] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>(DEFAULT_RECURRENCE);
  const [showRecurrence, setShowRecurrence] = useState(false);

  // Populate form when event or defaults change
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setType(event.type);
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      setStartTime(format(startDate, "HH:mm"));
      setEndTime(format(endDate, "HH:mm"));
      setDateStr(format(startDate, "yyyy-MM-dd"));
      setLocation(event.location || "");
      setMeetingUrl(event.meetingUrl || "");
      setDescription(event.description || "");
    } else {
      setTitle("");
      setType("video");
      setLocation("");
      setMeetingUrl("");
      setDescription("");
      setRecurrence(DEFAULT_RECURRENCE);
      setShowRecurrence(false);
      if (defaultDate) {
        setDateStr(format(defaultDate, "yyyy-MM-dd"));
      }
      if (defaultHour !== undefined) {
        setStartTime(`${String(defaultHour).padStart(2, "0")}:00`);
        // Use drag-selected end time when available, otherwise default +1.5h
        setEndTime(defaultEndTime ?? `${String(defaultHour + 1).padStart(2, "0")}:30`);
      }
    }
  }, [event, defaultDate, defaultHour, defaultEndTime, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const base = new Date(dateStr);
    const start = setMinutes(setHours(base, startH), startM);
    const end = setMinutes(setHours(base, endH), endM);

    onSave(
      {
        title,
        type,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        location,
        meetingUrl,
        description,
        recurrenceRule: buildRRule(recurrence),
      },
      event?.id
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa lịch dạy" : "Tạo lịch dạy mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin buổi học"
              : "Thêm buổi học mới vào lịch giảng dạy"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="event-title">Tiêu đề *</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Lập trình Python - Buổi 3"
              required
            />
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label>Loại buổi học</Label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-xs",
                      type === t.value
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    )}
                    onClick={() => setType(t.value)}
                  >
                    <Icon className={cn("w-4 h-4", t.color)} />
                    <span className="font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="event-date">Ngày *</Label>
              <Input
                id="event-date"
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-start">Bắt đầu *</Label>
              <Input
                id="event-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end">Kết thúc *</Label>
              <Input
                id="event-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="event-location">Phòng học</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="event-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: Phòng A101"
                className="pl-9"
              />
            </div>
          </div>

          {/* Meeting URL (for livestream/hybrid) */}
          {(type === "livestream" || type === "hybrid") && (
            <div className="space-y-2">
              <Label htmlFor="event-url">Link meeting</Label>
              <Input
                id="event-url"
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </div>
          )}

          {/* Recurrence toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowRecurrence((v) => !v)}
              className={cn(
                "flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg w-full transition-colors",
                showRecurrence
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <RepeatIcon className="w-4 h-4" />
              {showRecurrence ? "Ẩn lặp lịch" : "Thêm lặp lịch"}
              {recurrence.frequency !== "none" && !showRecurrence && (
                <span className="ml-auto text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                  Đang bật
                </span>
              )}
            </button>

            {showRecurrence && (
              <div className="mt-3 pl-2 border-l-2 border-primary-200">
                <RecurrenceSelector value={recurrence} onChange={setRecurrence} />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <DialogFooter className="gap-2">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="outline"
                className="mr-auto text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  onDelete(event!.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Xóa
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={!title || !dateStr}>
              {isEditing ? "Cập nhật" : "Tạo buổi học"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
