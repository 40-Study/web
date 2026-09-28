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
import { useMyCourses } from "@/hooks/queries/use-courses";
import { useClasses } from "@/hooks/queries/use-classes";

export interface EventFormData {
  title: string;
  type: "video" | "livestream" | "hybrid";
  startTime: string;
  endTime: string;
  location: string;
  meetingUrl: string;
  description: string;
  recurrenceRule?: string;
  /**
   * P1 QA 260927 teacher: bắt buộc khi TẠO MỚI — mỗi buổi học ở trang này giờ
   * là một livestream session thật (POST /livestream), và backend đòi class_id
   * hợp lệ. Trước bản vá này trang lịch chỉ lưu state React cục bộ, không gọi
   * API nào cả, nên buổi học "tạo" ở đây không gắn với khóa/lớp nào và không
   * bao giờ xuất hiện lại ở trang Bài tập (vốn liệt kê session theo course_id
   * thật từ backend) — đây là nguyên nhân gốc khiến bài tập "không dùng được".
   */
  courseId: string;
  classId: string;
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
  const [courseId, setCourseId] = useState("");
  const [classId, setClassId] = useState("");

  // P1 QA 260927 teacher: khóa/lớp thật của giáo viên — bắt buộc khi tạo mới.
  const { data: apiCourses = [], isLoading: coursesLoading } = useMyCourses();
  const { data: classes = [], isLoading: classesLoading } = useClasses(courseId, {
    enabled: !isEditing && !!courseId,
  });

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
      setCourseId(event.courseId || "");
    } else {
      setTitle("");
      setType("video");
      setLocation("");
      setMeetingUrl("");
      setDescription("");
      setRecurrence(DEFAULT_RECURRENCE);
      setShowRecurrence(false);
      setCourseId("");
      setClassId("");
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

  // Đổi khóa học thì reset lớp đã chọn — lớp thuộc khóa cũ không còn hợp lệ.
  useEffect(() => {
    setClassId("");
  }, [courseId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && !classId) return;
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
        courseId,
        classId,
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

          {/* Khóa học + Lớp — bắt buộc khi tạo mới, cố định sau khi tạo (backend
              không hỗ trợ đổi lớp của một buổi live đã tồn tại). */}
          {isEditing ? (
            <div className="rounded-lg border bg-gray-50 p-3 text-xs text-muted-foreground">
              Buổi học đã gắn với lớp học của bạn — không thể đổi khóa/lớp sau khi tạo.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="event-course">Khóa học *</Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger id="event-course" disabled={coursesLoading}>
                    <SelectValue placeholder={coursesLoading ? "Đang tải..." : "Chọn khóa học"} />
                  </SelectTrigger>
                  <SelectContent>
                    {apiCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-class">Lớp *</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger id="event-class" disabled={!courseId || classesLoading}>
                    <SelectValue
                      placeholder={
                        !courseId ? "Chọn khóa học trước" : classesLoading ? "Đang tải..." : "Chọn lớp"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {courseId && !classesLoading && classes.length === 0 && (
                  <p className="text-xs text-amber-600">Khóa học này chưa có lớp nào.</p>
                )}
              </div>
            </div>
          )}

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

          {/* Date + Time — chỉ đổi được lúc TẠO MỚI: PUT /livestream/:id
              (dto.UpdateLivestreamDTO) chỉ nhận title/description/max_viewers,
              không có lịch/giờ, nên sửa ở đây sau khi đã tạo sẽ chỉ đổi state
              cục bộ rồi mất ngay khi trang tải lại — im lặng "thành công giả". */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="event-date">Ngày *</Label>
              <Input
                id="event-date"
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                disabled={isEditing}
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
                disabled={isEditing}
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
                disabled={isEditing}
                required
              />
            </div>
          </div>
          {isEditing && (
            <p className="-mt-2 text-xs text-muted-foreground">
              Chưa hỗ trợ đổi lịch sau khi tạo — chỉ có thể sửa tiêu đề/mô tả.
            </p>
          )}

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
            <Button type="submit" disabled={!title || !dateStr || (!isEditing && !classId)}>
              {isEditing ? "Cập nhật" : "Tạo buổi học"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
