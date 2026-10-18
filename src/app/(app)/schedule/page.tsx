"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Clock, X, MapPin, Bell, Repeat, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useMyTimetableEntries } from "@/hooks/queries/use-class-schedule";
import { useLiveSessions } from "@/hooks/queries/use-live-sessions";
import WeekCalendarGrid, { type ScheduleEvent } from "@/components/schedule/week-calendar-grid";
import ScheduleEventDetailDialog from "@/components/schedule/schedule-event-detail-dialog";
import { liveSessionToEvent, timetableEntriesToEvents, visibleDateRange, toVnWallClock } from "@/lib/teacher-schedule-events";

const EVENT_COLORS = [
  { name: "Toán", bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-800", dot: "bg-blue-500" },
  { name: "Văn", bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-800", dot: "bg-emerald-500" },
  { name: "Anh", bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-800", dot: "bg-violet-500" },
  { name: "Lý", bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-800", dot: "bg-rose-500" },
  { name: "Hoá", bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-800", dot: "bg-amber-500" },
  { name: "Sinh", bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-800", dot: "bg-pink-500" },
  { name: "Sử", bg: "bg-cyan-100", border: "border-cyan-300", text: "text-cyan-800", dot: "bg-cyan-500" },
  { name: "Khác", bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-800", dot: "bg-gray-500" },
];

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Không lặp lại" },
  { value: "daily", label: "Hàng ngày" },
  { value: "weekly", label: "Hàng tuần" },
  { value: "weekdays", label: "Thứ 2 - Thứ 6" },
];

interface PersonalNote {
  id: string;
  dateStr: string; // YYYY-MM-DD
  startH: number; startM: number;
  endH: number; endM: number;
  title: string;
  description?: string;
  location?: string;
  reminderMin?: number;
  colorIdx: number;
  recurrence?: string;
}


function fmtDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function FullEventDialog({
  open,
  onOpenChange,
  date,
  hour,
  editingNote,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: Date;
  hour: number;
  editingNote?: PersonalNote | null;
  onSave: (note: PersonalNote) => void;
  onDelete?: (id: string) => void;
}) {
  const isEditing = !!editingNote;

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState(`${String(hour).padStart(2, "0")}:00`);
  const [endTime, setEndTime] = useState(`${String(Math.min(hour + 1, 23)).padStart(2, "0")}:30`);
  const [selectedDate, setSelectedDate] = useState(fmtDate(date));
  const [reminderMin, setReminderMin] = useState("15");
  const [colorIdx, setColorIdx] = useState(0);
  const [recurrence, setRecurrence] = useState("none");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (editingNote) {
        setTitle(editingNote.title);
        setDescription(editingNote.description || "");
        setLocation(editingNote.location || "");
        setStartTime(`${String(editingNote.startH).padStart(2, "0")}:${String(editingNote.startM).padStart(2, "0")}`);
        setEndTime(`${String(editingNote.endH).padStart(2, "0")}:${String(editingNote.endM).padStart(2, "0")}`);
        setSelectedDate(editingNote.dateStr);
        setReminderMin(String(editingNote.reminderMin ?? 15));
        setColorIdx(editingNote.colorIdx);
        setRecurrence(editingNote.recurrence || "none");
      } else {
        setTitle("");
        setDescription("");
        setLocation("");
        setStartTime(`${String(hour).padStart(2, "0")}:00`);
        setEndTime(`${String(Math.min(hour + 1, 23)).padStart(2, "0")}:30`);
        setSelectedDate(fmtDate(date));
        setReminderMin("15");
        setColorIdx(0);
        setRecurrence("none");
      }
    }
  }, [open, editingNote, date, hour]);

  const handleSave = () => {
    if (!title.trim()) return;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);

    onSave({
      id: editingNote?.id || crypto.randomUUID(),
      dateStr: selectedDate,
      startH: sh,
      startM: sm,
      endH: eh,
      endM: em,
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      reminderMin: parseInt(reminderMin) || undefined,
      colorIdx,
      recurrence: recurrence !== "none" ? recurrence : undefined,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (editingNote && onDelete) {
      onDelete(editingNote.id);
      onOpenChange(false);
    }
  };

  // Format date for display
  const displayDate = new Date(selectedDate + "T00:00:00");
  const dateLabel = displayDate.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className={cn("px-5 pt-5 pb-4", EVENT_COLORS[colorIdx].bg)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Tên môn học / Nội dung học"
                className="text-lg font-semibold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-gray-500"
                autoFocus
              />
              <p className="text-sm text-gray-600 mt-1">{dateLabel}</p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-gray-400 shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="time"
                value={startTime}
                onChange={e => {
                  setStartTime(e.target.value);
                  const [sh, sm] = e.target.value.split(":").map(Number);
                  const [eh, em] = endTime.split(":").map(Number);
                  if (sh * 60 + sm >= eh * 60 + em) {
                    const newEnd = Math.min(sh + 1, 23);
                    setEndTime(`${String(newEnd).padStart(2, "0")}:${String(sm).padStart(2, "0")}`);
                  }
                }}
                className="h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400">–</span>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Recurrence */}
          <div className="flex items-center gap-3">
            <Repeat className="h-5 w-5 text-gray-400 shrink-0" />
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger className="h-9 text-sm border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Phòng học (VD: A101, Online)"
              className="h-9 text-sm border-gray-200"
            />
          </div>

          {/* Reminder */}
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-400 shrink-0" />
            <Select value={reminderMin} onValueChange={setReminderMin}>
              <SelectTrigger className="h-9 text-sm border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Không nhắc nhở</SelectItem>
                <SelectItem value="5">5 phút trước</SelectItem>
                <SelectItem value="10">10 phút trước</SelectItem>
                <SelectItem value="15">15 phút trước</SelectItem>
                <SelectItem value="30">30 phút trước</SelectItem>
                <SelectItem value="60">1 giờ trước</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject Color */}
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-gray-400 shrink-0" />
            <div className="flex flex-wrap gap-2">
              {EVENT_COLORS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setColorIdx(i)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                    c.bg, c.text, c.border, "border",
                    colorIdx === i && "ring-2 ring-offset-1 ring-gray-400"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 shrink-0 mt-2" />
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ghi chú (bài tập, nội dung cần chuẩn bị...)"
              rows={2}
              className="text-sm border-gray-200 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
          {isEditing && onDelete ? (
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Xoá
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              {isEditing ? "Cập nhật" : "Thêm lịch"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────


export default function SchedulePage() {
  const today = useMemo(() => toVnWallClock(new Date()), []);
  const [range, setRange] = useState<{ from: string; to: string }>();
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [detail, setDetail] = useState<ScheduleEvent | null>(null);
  const [fullDialog, setFullDialog] = useState<{ open: boolean; date: Date; hour: number; editingNote?: PersonalNote | null }>({ open: false, date: today, hour: 9 });
  const { data: timetable, isLoading, isError } = useMyTimetableEntries(range);
  const { data: sessions, isError: liveError } = useLiveSessions({ page_size: 100 });
  const handleRange = useCallback((start: Date, end: Date) => {
    const next = visibleDateRange(start, end);
    setRange(current => current?.from === next.from && current?.to === next.to ? current : next);
  }, []);
  const events = useMemo(() => {
    const classEvents = timetableEntriesToEvents(timetable?.entries ?? [], { range, cancelled: timetable?.cancelled }).map(event => ({ ...event, teacher: undefined }));
    const liveEvents = (sessions?.sessions ?? []).map(session => ({ ...liveSessionToEvent(session), teacher: undefined, meetingUrl: session.status === "live" ? `/rooms/${session.id}` : undefined }));
    const personal: ScheduleEvent[] = notes.map(note => ({ id: note.id, title: note.title, startTime: new Date(`${note.dateStr}T${String(note.startH).padStart(2,"0")}:${String(note.startM).padStart(2,"0")}:00`).toISOString(), endTime: new Date(`${note.dateStr}T${String(note.endH).padStart(2,"0")}:${String(note.endM).padStart(2,"0")}:00`).toISOString(), type: "hybrid", status: "upcoming", location: note.location, description: note.description }));
    return [...classEvents, ...liveEvents, ...personal];
  }, [timetable, range, sessions, notes]);
  return <div>
    {isLoading && <p role="status" className="mb-2 text-xs text-muted-foreground">Đang tải lịch học…</p>}
    {(isError || liveError) && <p role="alert" className="mb-2 text-sm text-red-600">Chưa tải được đầy đủ lịch học. Vui lòng tải lại trang.</p>}
    <WeekCalendarGrid events={events} selectable onRangeChange={handleRange}
      onSelectMore={start => setFullDialog({ open: true, date: start, hour: start.getHours(), editingNote: null })}
      onEventClick={event => { const note = notes.find(item => item.id === event.id); if (note) setFullDialog({ open: true, date: new Date(`${note.dateStr}T00:00:00`), hour: note.startH, editingNote: note }); else setDetail(event); }}
      headerActions={<Button size="sm" className="rounded-lg gap-1.5" onClick={() => setFullDialog({ open: true, date: today, hour: today.getHours(), editingNote: null })}><Plus className="h-4 w-4" />Ghi chú</Button>}
    />
    <FullEventDialog open={fullDialog.open} onOpenChange={open => setFullDialog(current => ({ ...current, open }))} date={fullDialog.date} hour={fullDialog.hour} editingNote={fullDialog.editingNote} onSave={note => setNotes(current => [...current.filter(item => item.id !== note.id), note])} onDelete={id => setNotes(current => current.filter(item => item.id !== id))} />
    <ScheduleEventDetailDialog event={detail} open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }} />
  </div>;
}
