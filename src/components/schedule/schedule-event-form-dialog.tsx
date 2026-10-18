"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { format, setHours, setMinutes } from "date-fns";
import { Bell, Loader2, MapPin, Trash2 } from "lucide-react";
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
import type { ScheduleEvent } from "./week-calendar-grid";
import { useMyCourses } from "@/hooks/queries/use-courses";
import { useClasses } from "@/hooks/queries/use-classes";
import { selectableClasses } from "@/lib/class-status";

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
   * API nào cả, nên buổi học "tạo" ở đây không gắn với khoá/lớp nào và không
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
  onSave: (data: EventFormData, eventId?: string) => Promise<void> | void;
  onDelete?: (eventId: string) => Promise<void> | void;
  sessionActions?: ReactNode;
}

/**
 * Kiểm cặp giờ của form. Trả thông báo lỗi tiếng Việt, hoặc null khi hợp lệ.
 * `checkPast` bật khi tạo mới hoặc khi giờ bắt đầu bị đổi (sửa tiêu đề của buổi đã quá giờ không bị chặn).
 * Backend kiểm lại cùng luật (400) nên đây chỉ là phản hồi sớm, không phải rào duy nhất.
 */
export function validateEventTimes(start: Date, end: Date, checkPast: boolean, now = new Date()): string | null {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Ngày hoặc giờ không hợp lệ.";
  if (end <= start) return "Giờ kết thúc phải sau giờ bắt đầu.";
  // Dung sai 1 phút khớp backend (livestreamClockSkew): ô giờ chọn theo phút.
  if (checkPast && start.getTime() < now.getTime() - 60_000) return "Giờ bắt đầu không được nằm trong quá khứ.";
  return null;
}

export default function ScheduleEventFormDialog({
  open,
  onOpenChange,
  event,
  defaultDate,
  defaultHour,
  defaultEndTime,
  onSave,
  onDelete,
  sessionActions,
}: ScheduleEventFormDialogProps) {
  const isEditing = !!event;
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Chỉ buổi chưa bắt đầu mới đổi lịch được (backend trả 409 với buổi đang live/đã kết thúc).
  const canEditTime = !isEditing || event?.status === "upcoming";

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:30");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [courseId, setCourseId] = useState("");
  const [classId, setClassId] = useState("");
  const [error, setError] = useState<string | null>(null);

  // P1 QA 260927 teacher: khoá/lớp thật của giáo viên — bắt buộc khi tạo mới.
  const { data: apiCourses = [], isLoading: coursesLoading } = useMyCourses(undefined, { enabled: open && !isEditing });
  const { data: classes = [], isLoading: classesLoading } = useClasses(courseId, {
    enabled: open && !isEditing && !!courseId,
  });

  // Populate form when event or defaults change
  useEffect(() => {
    setError(null);
    setConfirmDelete(false);
    if (event) {
      setTitle(event.title);
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      setStartTime(format(startDate, "HH:mm"));
      setEndTime(format(endDate, "HH:mm"));
      setDateStr(format(startDate, "yyyy-MM-dd"));
      setLocation(event.location || "");
      setDescription(event.description || "");
      setCourseId(event.courseId || "");
    } else {
      setTitle("");
      setLocation("");
      setDescription("");
      setCourseId("");
      setClassId("");
      if (defaultDate) {
        setDateStr(format(defaultDate, "yyyy-MM-dd"));
      }
      if (defaultHour !== undefined) {
        setStartTime(`${String(defaultHour).padStart(2, "0")}:${String(defaultDate?.getMinutes() ?? 0).padStart(2, "0")}`);
        // Use drag-selected end time when available, otherwise default +1.5h
        setEndTime(defaultEndTime ?? (defaultHour >= 22 ? "23:59" : `${String(defaultHour + 1).padStart(2, "0")}:30`));
      }
    }
  }, [event, defaultDate, defaultHour, defaultEndTime, open]);

  // Đổi khoá học thì reset lớp đã chọn — lớp thuộc khoá cũ không còn hợp lệ.
  useEffect(() => {
    setClassId("");
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busyRef.current) return;
    if (!isEditing && !classId) return;
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const base = new Date(`${dateStr}T00:00:00`);
    const start = setMinutes(setHours(base, startH), startM);
    const end = setMinutes(setHours(base, endH), endM);

    if (canEditTime) {
      // Sửa buổi: chỉ kiểm "quá khứ" khi người dùng thực sự dời giờ bắt đầu.
      const startChanged = !event || start.getTime() !== new Date(event.startTime).getTime();
      const problem = validateEventTimes(start, end, !isEditing || startChanged);
      if (problem) {
        setError(problem);
        return;
      }
    }

    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
    await onSave(
      {
        title,
        // Mọi buổi ở trang này là livestream thật (POST /livestream); các lựa chọn loại buổi, liên kết
        // họp và lặp lịch trước đây không có trường nào ở backend nên đã bị bỏ khỏi form thay vì gửi rồi mất.
        type: "livestream",
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        location,
        meetingUrl: "",
        description,
        courseId,
        classId,
      },
      event?.id
    );
    onOpenChange(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Chưa lưu được buổi học. Vui lòng thử lại."); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const handleDelete = async () => {
    if (!event || !onDelete || busyRef.current) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try { await onDelete(event.id); onOpenChange(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Chưa huỷ được buổi học."); }
    finally { busyRef.current = false; setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={value => { if (!busyRef.current) onOpenChange(value); }}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
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

        {sessionActions}
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={busy} className="space-y-4 min-w-0">
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

          {/* Khoá học + Lớp — bắt buộc khi tạo mới, cố định sau khi tạo (backend
              không hỗ trợ đổi lớp của một buổi live đã tồn tại). */}
          {isEditing ? (
            <div className="rounded-lg border bg-gray-50 p-3 text-xs text-muted-foreground">
              Buổi học đã gắn với lớp học của bạn — không thể đổi khoá/lớp sau khi tạo.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="event-course">Khoá học *</Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger id="event-course" disabled={coursesLoading}>
                    <SelectValue placeholder={coursesLoading ? "Đang tải..." : "Chọn khoá học"} />
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
                        !courseId ? "Chọn khoá học trước" : classesLoading ? "Đang tải..." : "Chọn lớp"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableClasses(classes).map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {courseId && !classesLoading && classes.length === 0 && (
                  <p className="text-xs text-amber-600">Khoá học này chưa có lớp nào.</p>
                )}
              </div>
            </div>
          )}

          {/* Date + Time — B-09: gửi đủ giờ bắt đầu/kết thúc và đổi được sau khi tạo (PUT /livestream/:id
              nay nhận scheduled_at/scheduled_end_at); chỉ khoá khi buổi đã bắt đầu hoặc kết thúc. */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="event-date">Ngày *</Label>
              <Input
                id="event-date"
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                disabled={!canEditTime}
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
                disabled={!canEditTime}
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
                disabled={!canEditTime}
                required
              />
            </div>
          </div>
          {!canEditTime && (
            <p className="-mt-2 text-xs text-muted-foreground">
              Buổi học đã bắt đầu hoặc đã kết thúc nên không đổi được lịch.
            </p>
          )}
          {error && (
            <p role="alert" className="-mt-2 text-sm text-red-600">
              {error}
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
                maxLength={255}
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900 flex gap-2"><Bell className="w-4 h-4 shrink-0" /><span>Tự động nhắc trước 15 phút và khi đến giờ cho giáo viên, học sinh của lớp và phụ huynh đã liên kết.</span></div>
          {confirmDelete && <p role="alert" className="text-xs text-red-600">Huỷ buổi học này? Lịch nhắc học của buổi cũng sẽ ngừng.</p>}
          {/* Footer Actions */}
          <DialogFooter className="gap-2">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="outline"
                className="mr-auto text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => void handleDelete()}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {confirmDelete ? "Xác nhận huỷ buổi" : "Huỷ buổi học"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={!title || !dateStr || (!isEditing && !classId)}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{isEditing ? "Lưu thay đổi" : "Tạo buổi học"}
            </Button>
          </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
