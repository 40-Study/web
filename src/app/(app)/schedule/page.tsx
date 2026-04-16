"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Loader2, ChevronLeft, ChevronRight, Plus, Clock, X, MapPin, Bell,
  Repeat, Trash2, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useMySchedules } from "@/hooks/queries/use-class-schedule";
import type { ClassSchedule } from "@/types/class-schedule";

// ─── Constants ──────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7);
const WEEKDAYS_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const WEEKDAYS_MINI = ["Cn", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS_VN = [
  "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12",
];

const EVENT_COLORS = [
  { name: "Toán", bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-800", dot: "bg-blue-500" },
  { name: "Văn", bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-800", dot: "bg-emerald-500" },
  { name: "Anh", bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-800", dot: "bg-violet-500" },
  { name: "Lý", bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-800", dot: "bg-rose-500" },
  { name: "Hóa", bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-800", dot: "bg-amber-500" },
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

interface CalEvent {
  id: string;
  title: string;
  dow: number;
  startH: number; startM: number;
  endH: number; endM: number;
  colorIdx: number;
  teacher?: string;
  room?: string;
  isPersonal?: boolean;
}

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

// ─── Helpers ────────────────────────────────────────────────────────────────

function getWeekDates(base: Date): Date[] {
  const d = new Date(base);
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt;
  });
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function fmtHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function toEvents(schedules: ClassSchedule[]): CalEvent[] {
  return schedules.map((s, i) => {
    const [sh, sm] = s.start_time.split(":").map(Number);
    const [eh, em] = s.end_time.split(":").map(Number);
    return {
      id: s.id, title: s.title || "Buổi học", dow: s.day_of_week,
      startH: sh, startM: sm, endH: eh, endM: em,
      colorIdx: i % EVENT_COLORS.length, teacher: s.teacher_name, room: s.room,
    };
  });
}

// ─── Mini Calendar ──────────────────────────────────────────────────────────

function MiniCal({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) {
  const [view, setView] = useState(new Date(selected));
  const today = new Date();
  const y = view.getFullYear(), m = view.getMonth();
  const dim = new Date(y, m + 1, 0).getDate();
  const fi = (new Date(y, m, 1).getDay() + 6) % 7;
  const isCur = today.getFullYear() === y && today.getMonth() === m;

  const cells = useMemo(() => {
    const a: (number | null)[] = [];
    for (let i = 0; i < fi; i++) a.push(null);
    for (let d = 1; d <= dim; d++) a.push(d);
    return a;
  }, [fi, dim]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-700">{MONTHS_VN[m]}, {y}</span>
        <div className="flex">
          <button onClick={() => setView(new Date(y, m-1, 1))} className="p-0.5 rounded hover:bg-gray-100"><ChevronLeft className="h-3.5 w-3.5 text-gray-500" /></button>
          <button onClick={() => setView(new Date(y, m+1, 1))} className="p-0.5 rounded hover:bg-gray-100"><ChevronRight className="h-3.5 w-3.5 text-gray-500" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS_MINI.map(d => <div key={d} className="text-[9px] font-medium text-gray-400 py-0.5">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="h-5" />;
          const dt = new Date(y, m, day);
          const isT = isCur && day === today.getDate();
          const isS = sameDay(dt, selected);
          return (
            <button key={i} onClick={() => onSelect(dt)} className={cn(
              "h-5 w-5 mx-auto rounded-full text-[10px] flex items-center justify-center",
              isS && "bg-blue-600 text-white font-bold",
              isT && !isS && "bg-blue-100 text-blue-700 font-bold",
              !isT && !isS && "text-gray-600 hover:bg-gray-100"
            )}>{day}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quick Add Popup (single click) ─────────────────────────────────────────

function QuickAddPopup({
  x, y, date, hour,
  onSave, onMore, onClose,
}: {
  x: number; y: number; date: Date; hour: number;
  onSave: (title: string) => void;
  onMore: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const dateLabel = date.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });
  const timeLabel = `${String(hour).padStart(2, "0")}:00 – ${String(hour + 1).padStart(2, "0")}:00`;

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 overflow-hidden"
      style={{ left: Math.min(x, window.innerWidth - 340), top: Math.min(y, window.innerHeight - 280) }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-xs font-medium text-gray-500">Sự kiện mới</span>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <Input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Thêm tiêu đề"
          className="text-base border-0 border-b-2 border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-500 font-medium transition-colors"
          onKeyDown={e => { if (e.key === "Enter" && title.trim()) onSave(title.trim()); }}
        />

        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
          <div className="flex flex-col">
            <span className="font-medium">{dateLabel}</span>
            <span className="text-xs text-gray-400">{timeLabel}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onMore}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Thêm tùy chọn
            <ChevronRight className="h-3 w-3" />
          </button>
          <Button
            size="sm"
            onClick={() => { if (title.trim()) onSave(title.trim()); }}
            disabled={!title.trim()}
            className={cn(
              "px-4 rounded-full transition-all",
              title.trim() ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-100 text-gray-400"
            )}
          >
            Lưu
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Full Event Dialog (Student Schedule) ──────────────────────────────────

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
              Xóa
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Hủy
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
  const today = new Date();
  const [baseDate, setBaseDate] = useState(new Date(today));
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [quickAdd, setQuickAdd] = useState<{ x: number; y: number; date: Date; hour: number } | null>(null);
  const [fullDialog, setFullDialog] = useState<{
    open: boolean;
    date: Date;
    hour: number;
    editingNote?: PersonalNote | null;
  }>({ open: false, date: today, hour: 9, editingNote: null });
  const gridRef = useRef<HTMLDivElement>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: schedules, isLoading } = useMySchedules();

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);
  const weekEvents = useMemo(() => toEvents(schedules || []), [schedules]);

  useEffect(() => {
    if (gridRef.current) {
      const scrollTo = Math.max(0, (today.getHours() - 7) * 60 - 100);
      gridRef.current.scrollTop = scrollTo;
    }
  }, []);

  const prevWeek = useCallback(() => {
    setBaseDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const nextWeek = useCallback(() => {
    setBaseDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const goToday = useCallback(() => setBaseDate(new Date()), []);

  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];
  const weekLabel = `${weekStart.getDate()} – ${weekEnd.getDate()} thg ${weekEnd.getMonth()+1}, ${weekEnd.getFullYear()}`;

  const nowH = today.getHours();
  const nowM = today.getMinutes();
  const nowPx = (nowH - 7) * 60 + nowM;
  const showNowLine = weekDates.some(d => sameDay(d, today)) && nowH >= 7 && nowH <= 23;

  const dayEvents = (dow: number) => weekEvents.filter(e => e.dow === dow);
  const dayNotes = (date: Date) => notes.filter(n => n.dateStr === fmtDate(date));

  // Single click = quick popup, double click = full dialog
  const handleCellClick = (e: React.MouseEvent, date: Date, hour: number) => {
    e.stopPropagation();
    if (clickTimer.current) {
      // Double click
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      setQuickAdd(null);
      setFullDialog({ open: true, date, hour, editingNote: null });
    } else {
      // Single click - wait to see if double
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setQuickAdd({ x: rect.left + rect.width / 2, y: rect.top, date, hour });
      }, 250);
    }
  };

  // Click on existing note to edit
  const handleNoteClick = (e: React.MouseEvent, note: PersonalNote) => {
    e.stopPropagation();
    const noteDate = new Date(note.dateStr + "T00:00:00");
    setQuickAdd(null);
    setFullDialog({ open: true, date: noteDate, hour: note.startH, editingNote: note });
  };

  const handleQuickSave = (title: string) => {
    if (!quickAdd) return;
    const note: PersonalNote = {
      id: crypto.randomUUID(),
      dateStr: fmtDate(quickAdd.date),
      startH: quickAdd.hour,
      startM: 0,
      endH: quickAdd.hour + 1,
      endM: 0,
      title,
      colorIdx: 0,
    };
    setNotes(prev => [...prev, note]);
    setQuickAdd(null);
  };

  const handleQuickMore = () => {
    if (!quickAdd) return;
    setFullDialog({ open: true, date: quickAdd.date, hour: quickAdd.hour, editingNote: null });
    setQuickAdd(null);
  };

  const handleFullSave = (note: PersonalNote) => {
    setNotes(prev => {
      const existingIdx = prev.findIndex(n => n.id === note.id);
      if (existingIdx >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existingIdx] = note;
        return updated;
      }
      // Add new
      return [...prev, note];
    });
  };

  const handleDeleteNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden" onClick={() => setQuickAdd(null)}>
      {/* Sidebar */}
      <div className="w-52 border-r border-gray-100 p-3 flex-col gap-4 shrink-0 overflow-y-auto hidden lg:flex">
        <Button variant="outline" className="w-full justify-start gap-2 shadow-sm text-sm" onClick={() => setFullDialog({ open: true, date: today, hour: today.getHours(), editingNote: null })}>
          <Plus className="h-4 w-4" /> Tạo
        </Button>
        <MiniCal selected={baseDate} onSelect={d => setBaseDate(d)} />
        <div className="space-y-1.5 mt-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase">Lịch của tôi</p>
          <label className="flex items-center gap-2 text-xs text-gray-600"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />Buổi học</label>
          <label className="flex items-center gap-2 text-xs text-gray-600"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Ghi chú</label>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 shrink-0">
          <button onClick={prevWeek} className="p-1.5 rounded-full hover:bg-gray-100"><ChevronLeft className="h-5 w-5 text-gray-600" /></button>
          <button onClick={nextWeek} className="p-1.5 rounded-full hover:bg-gray-100"><ChevronRight className="h-5 w-5 text-gray-600" /></button>
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={goToday}>Hôm nay</Button>
          <h2 className="text-sm font-medium text-gray-700 ml-2 flex-1">{weekLabel}</h2>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-gray-100 shrink-0">
          <div />
          {weekDates.map((date, i) => {
            const dow = date.getDay();
            const isT = sameDay(date, today);
            return (
              <div key={i} className={cn("text-center py-1.5 border-l border-gray-50", isT && "bg-blue-50/50")}>
                <p className={cn("text-[10px] uppercase font-medium", isT ? "text-blue-600" : "text-gray-400")}>{WEEKDAYS_SHORT[dow]}</p>
                <span className={cn(
                  "inline-flex items-center justify-center text-lg font-medium mt-0.5",
                  isT ? "w-9 h-9 rounded-full bg-blue-600 text-white" : "text-gray-800"
                )}>{date.getDate()}</span>
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div ref={gridRef} className="flex-1 overflow-y-auto relative">
          <div className="grid grid-cols-[48px_repeat(7,1fr)]">
            {HOURS.map(hour => (
              <div key={hour} className="contents">
                <div className="h-[60px] flex items-start justify-end pr-1.5 -mt-2">
                  <span className="text-[10px] text-gray-400 leading-none">{fmtHour(hour)}</span>
                </div>
                {weekDates.map((date, di) => {
                  const dow = date.getDay();
                  const isT = sameDay(date, today);
                  const evs = dayEvents(dow).filter(e => e.startH === hour);
                  const nts = dayNotes(date).filter(n => n.startH === hour);

                  return (
                    <div
                      key={di}
                      className={cn("h-[60px] border-l border-t border-gray-100 relative cursor-pointer hover:bg-blue-50/30", isT && "bg-blue-50/20")}
                      onClick={e => handleCellClick(e, date, hour)}
                    >
                      {evs.map(ev => {
                        const dur = (ev.endH - ev.startH) * 60 + (ev.endM - ev.startM);
                        const c = EVENT_COLORS[ev.colorIdx];
                        return (
                          <div key={ev.id} className={cn("absolute left-0.5 right-0.5 rounded-md border px-1.5 py-0.5 text-[11px] overflow-hidden z-10", c.bg, c.border, c.text)}
                            style={{ top: `${ev.startM}px`, height: `${Math.max(dur, 22)}px` }} onClick={e => e.stopPropagation()}>
                            <p className="font-semibold truncate">{ev.title}</p>
                            {dur >= 35 && <p className="truncate opacity-70">{ev.startH}:{String(ev.startM).padStart(2,"0")} – {ev.endH}:{String(ev.endM).padStart(2,"0")}</p>}
                          </div>
                        );
                      })}
                      {nts.map(nt => {
                        const dur = (nt.endH - nt.startH) * 60 + (nt.endM - nt.startM);
                        const c = EVENT_COLORS[nt.colorIdx] || EVENT_COLORS[0];
                        const fmtTime = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                        return (
                          <div
                            key={nt.id}
                            className={cn(
                              "absolute left-0.5 right-0.5 rounded-md border px-1.5 py-0.5 text-[11px] z-10 cursor-pointer",
                              "hover:shadow-md hover:scale-[1.02] transition-all",
                              c.bg, c.border, c.text
                            )}
                            style={{ top: `${nt.startM}px`, height: `${Math.max(dur, 22)}px` }}
                            onClick={e => handleNoteClick(e, nt)}
                          >
                            <p className="font-semibold truncate">{nt.title}</p>
                            {dur >= 35 && <p className="truncate opacity-70">{fmtTime(nt.startH, nt.startM)} – {fmtTime(nt.endH, nt.endM)}</p>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Now line */}
          {showNowLine && (
            <div className="absolute left-12 right-0 flex items-center z-20 pointer-events-none" style={{ top: `${nowPx}px` }}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
              <div className="flex-1 h-[2px] bg-red-500" />
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Popup */}
      {quickAdd && (
        <QuickAddPopup
          x={quickAdd.x} y={quickAdd.y} date={quickAdd.date} hour={quickAdd.hour}
          onSave={handleQuickSave} onMore={handleQuickMore} onClose={() => setQuickAdd(null)}
        />
      )}

      {/* Full Event Dialog */}
      <FullEventDialog
        open={fullDialog.open}
        onOpenChange={v => setFullDialog(p => ({ ...p, open: v, editingNote: v ? p.editingNote : null }))}
        date={fullDialog.date}
        hour={fullDialog.hour}
        editingNote={fullDialog.editingNote}
        onSave={handleFullSave}
        onDelete={handleDeleteNote}
      />
    </div>
  );
}
