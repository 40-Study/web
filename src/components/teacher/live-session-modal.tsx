"use client";

import { useState, useCallback } from "react";
import { Clock, Calendar, Info, Settings, Video, Link2, X, Paperclip } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

export type LivePlatform = "40study" | "zoom" | "custom";

export interface LiveSessionFormData {
  // Basic info
  title: string;
  description: string;
  attachments: File[];
  // Schedule
  date: string;
  startTime: string;
  duration: number; // minutes
  // Settings
  platform: LivePlatform;
  customLink?: string;
  enableReminder: boolean;
  enableRecording: boolean;
}

interface LiveSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveDraft?: (data: LiveSessionFormData) => void;
  onSubmit: (data: LiveSessionFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<LiveSessionFormData>;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const DURATION_OPTIONS = [
  { value: 30, label: "30 phút" },
  { value: 45, label: "45 phút" },
  { value: 60, label: "60 phút" },
  { value: 90, label: "90 phút" },
  { value: 120, label: "120 phút" },
];

const DEFAULT_FORM_DATA: LiveSessionFormData = {
  title: "",
  description: "",
  attachments: [],
  date: "",
  startTime: "20:00",
  duration: 60,
  platform: "40study",
  customLink: "",
  enableReminder: true,
  enableRecording: true,
};

// ─── Helper ────────────────────────────────────────────────────────────────

function formatEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime) return "";
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}

function formatDateVN(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function LiveSessionModal({
  open,
  onOpenChange,
  onSaveDraft,
  onSubmit,
  isLoading = false,
  initialData,
}: LiveSessionModalProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState<LiveSessionFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  });

  const updateForm = useCallback(
    <K extends keyof LiveSessionFormData>(key: K, value: LiveSessionFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
    e.target.value = "";
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  }, []);

  const handleSaveDraft = useCallback(() => {
    onSaveDraft?.(form);
  }, [form, onSaveDraft]);

  const handleSubmit = useCallback(() => {
    onSubmit(form);
  }, [form, onSubmit]);

  const handleNext = useCallback(() => {
    if (activeTab === "basic") setActiveTab("schedule");
    else if (activeTab === "schedule") setActiveTab("settings");
  }, [activeTab]);

  const endTime = formatEndTime(form.startTime, form.duration);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Cai dat phong hoc Truc tuyen</DialogTitle>
          <DialogDescription>Len lich buoi Live Session cho khoa hoc cua ban</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="basic" className="gap-2">
              <Info className="h-4 w-4" />
              Thong tin co ban
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" />
              Lich trinh
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Cai dat phong live
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Info */}
          <TabsContent value="basic" className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Tieu de buoi live
              </label>
              <Input
                placeholder="VD: Q&A: Giải đáp lỗi cài đặt Go Compiler & VS Code"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Mo ta & chuan bi
                </label>
                <label className="flex items-center gap-2 text-sm text-primary-600 cursor-pointer hover:underline">
                  <Paperclip className="h-4 w-4" />
                  Dinh kem File
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                </label>
              </div>
              <Textarea
                placeholder="Trong buổi này chúng ta sẽ cài đặt các công cụ cần thiết để bắt đầu lập trình với Go và framework bao gồm: Go Compiler, VS Code, và Postman."
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                rows={4}
              />
              {/* Attachments */}
              {form.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-sm"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span className="max-w-[150px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="hover:text-primary-900"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Schedule */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Ngay phat song
                </label>
                <div className="relative mt-2">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateForm("date", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Gio bat dau
                </label>
                <div className="relative mt-2">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => updateForm("startTime", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Thoi luong
              </label>
              <Select
                value={String(form.duration)}
                onValueChange={(v) => updateForm("duration", Number(v))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calculated end time */}
            {form.date && form.startTime && (
              <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-xl text-sm">
                <Clock className="h-4 w-4 text-primary-600" />
                <span>
                  Buoi live se dien ra vao{" "}
                  <strong>
                    {form.startTime} - {endTime}
                  </strong>{" "}
                  ngay <strong>{formatDateVN(form.date)}</strong>
                </span>
              </div>
            )}
          </TabsContent>

          {/* Tab 3: Settings */}
          <TabsContent value="settings" className="space-y-6">
            {/* Platform selection */}
            <div>
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Nền tảng phát sóng
              </label>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <PlatformCard
                  icon={<Video className="h-6 w-6" />}
                  label="40Study Native"
                  sublabel="Khuyến dùng"
                  selected={form.platform === "40study"}
                  onClick={() => updateForm("platform", "40study")}
                />
                <PlatformCard
                  icon={<Video className="h-6 w-6" />}
                  label="Zoom Meeting"
                  selected={form.platform === "zoom"}
                  onClick={() => updateForm("platform", "zoom")}
                />
                <PlatformCard
                  icon={<Link2 className="h-6 w-6" />}
                  label="Link tùy chọn"
                  selected={form.platform === "custom"}
                  onClick={() => updateForm("platform", "custom")}
                />
              </div>
              {form.platform === "custom" && (
                <Input
                  placeholder="Nhập link phòng họp..."
                  value={form.customLink}
                  onChange={(e) => updateForm("customLink", e.target.value)}
                  className="mt-3"
                />
              )}
            </div>

            {/* Additional options */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Tuy chon bo sung
              </label>

              <div className="flex items-center justify-between p-3 border rounded-xl">
                <div>
                  <p className="font-medium">Thông báo nhắc nhở</p>
                  <p className="text-sm text-muted-foreground">
                    Gửi thông báo tự động tới học sinh và phụ huynh trước 30 phút
                  </p>
                </div>
                <Switch
                  checked={form.enableReminder}
                  onCheckedChange={(v) => updateForm("enableReminder", v)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-xl">
                <div>
                  <p className="font-medium">Tự động ghi lại (Recording)</p>
                  <p className="text-sm text-muted-foreground">
                    Lưu trữ bản ghi sau khi kết thúc
                  </p>
                </div>
                <Switch
                  checked={form.enableRecording}
                  onCheckedChange={(v) => updateForm("enableRecording", v)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Hủy bỏ
          </Button>
          <div className="flex gap-2">
            {onSaveDraft && (
              <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading}>
                Lưu nháp
              </Button>
            )}
            {activeTab !== "settings" ? (
              <Button onClick={handleNext}>Tiếp theo</Button>
            ) : (
              <Button onClick={handleSubmit} isLoading={isLoading}>
                Tạo buổi live
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Platform Card Sub-component ───────────────────────────────────────────

interface PlatformCardProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
}

function PlatformCard({ icon, label, sublabel, selected, onClick }: PlatformCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
        selected
          ? "border-primary-600 bg-primary-50 text-primary-700"
          : "border-input hover:border-primary-300 hover:bg-muted/50"
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {sublabel && (
        <span className="text-xs text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
          {sublabel}
        </span>
      )}
    </button>
  );
}

export default LiveSessionModal;
