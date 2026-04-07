"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Radio,
  Layers,
  Check,
  Upload,
  X,
  Loader2,
  ImageIcon,
  Film,
  Plus,
  GripVertical,
  FileText,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCreateCourse } from "@/hooks/queries/use-courses";
import { useCategoryList } from "@/hooks/queries/use-categories";
import { useVideoUpload } from "@/hooks/use-video-upload";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

// ─── Constants ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Thông tin cơ bản" },
  { id: 2, title: "Hình ảnh & Mô tả" },
  { id: 3, title: "Cài đặt giá" },
  { id: 4, title: "Hoàn tất" },
];

const FORMATS = [
  {
    id: "video",
    label: "Video Quay Sẵn",
    description: "Học qua video bài giảng",
    icon: Play,
  },
  {
    id: "livestream",
    label: "Livestream",
    description: "Học trực tiếp qua Zoom/Meet",
    icon: Radio,
  },
  {
    id: "hybrid",
    label: "Hybrid (Kết hợp)",
    description: "Video & Buổi học trực tiếp",
    icon: Layers,
  },
];

const LEVELS = [
  { value: "all", label: "Tất cả trình độ" },
  { value: "beginner", label: "Người mới bắt đầu" },
  { value: "intermediate", label: "Trung cấp" },
  { value: "advanced", label: "Nâng cao" },
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface CourseFormData {
  title: string;
  format: string;
  category_id: string;
  level: string;
  short_description: string;
  // Step 2
  thumbnail_file: File | null;
  thumbnail_preview: string;
  thumbnail_url: string;
  preview_video_file: File | null;
  preview_video_url: string;
  video_upload_id: string;
  description: string;
  objectives: string[];
  requirements: string[];
  target_audience: string[];
  // Step 3
  is_free: boolean;
  price: string;
  discount_price: string;
  discount_expires_at: string;
  is_featured: boolean;
  // Step 4
  language: string;
  tag_ids: string[];
}

const initialFormData: CourseFormData = {
  title: "",
  format: "hybrid",
  category_id: "",
  level: "all",
  short_description: "",
  thumbnail_file: null,
  thumbnail_preview: "",
  thumbnail_url: "",
  preview_video_file: null,
  preview_video_url: "",
  video_upload_id: "",
  description: "",
  objectives: [""],
  requirements: [""],
  target_audience: [""],
  is_free: false,
  price: "",
  discount_price: "",
  discount_expires_at: "",
  is_featured: false,
  language: "vi",
  tag_ids: [],
};

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function CreateCoursePage() {
  const router = useRouter();
  const createCourse = useCreateCourse();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);

  const update = useCallback(<K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canGoNext = () => {
    if (currentStep === 1) return formData.title.trim().length > 0;
    return true;
  };

  const buildPayload = () => ({
    title: formData.title,
    short_description: formData.short_description || undefined,
    description: formData.description || undefined,
    thumbnail_url: formData.thumbnail_url || null,
    preview_video_url: formData.preview_video_url || null,
    category_id: formData.category_id || null,
    level: formData.level === "all" ? "beginner" : formData.level,
    language: formData.language,
    price: formData.is_free ? 0 : parseFloat(formData.price) || 0,
    discount_price: formData.is_free ? null : parseFloat(formData.discount_price) || null,
    discount_expires_at: formData.discount_expires_at ? new Date(formData.discount_expires_at).toISOString() : null,
    is_free: formData.is_free,
    objectives: formData.objectives.filter(Boolean),
    requirements: formData.requirements.filter(Boolean),
    target_audience: formData.target_audience.filter(Boolean),
    tag_ids: formData.tag_ids,
  });

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tên khóa học");
      return;
    }
    try {
      const course = await createCourse.mutateAsync(buildPayload());
      toast.success("Đã lưu nháp thành công");
      router.push(`/teacher/courses/${course.id}`);
    } catch {
      // error handled in hook
    }
  };

  const handlePublish = async () => {
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tên khóa học");
      return;
    }
    try {
      const course = await createCourse.mutateAsync(buildPayload());
      toast.success("Khóa học đã được tạo! Thêm bài học ngay.");
      router.push(`/teacher/courses/${course.id}`);
    } catch {
      // error handled in hook
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/teacher/courses")}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tạo khóa học mới</h1>
            <p className="text-sm text-muted-foreground">
              Bước {currentStep}/{STEPS.length} — {STEPS[currentStep - 1].title}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={createCourse.isPending}>
            {createCourse.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Lưu nháp
          </Button>
          {currentStep === 4 ? (
            <Button size="sm" onClick={handlePublish} disabled={createCourse.isPending}>
              Xuất bản khóa học
            </Button>
          ) : (
            <Button size="sm" onClick={() => setCurrentStep((s) => s + 1)} disabled={!canGoNext()}>
              Tiếp tục
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar — Step Progress */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-24 space-y-1">
            {STEPS.map((step) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <button
                  key={step.id}
                  onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                  className={cn(
                    "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-colors text-left",
                    isCurrent && "bg-primary-50 text-primary-700 font-medium",
                    isCompleted && "text-green-600 hover:bg-green-50 cursor-pointer",
                    !isCurrent && !isCompleted && "text-muted-foreground cursor-default"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                      isCurrent && "bg-primary-600 text-white",
                      isCompleted && "bg-green-500 text-white",
                      !isCurrent && !isCompleted && "bg-gray-200 text-gray-500"
                    )}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.id}
                  </div>
                  {step.title}
                </button>
              );
            })}

            {/* Progress bar */}
            <div className="mt-6 px-3">
              <p className="text-xs text-muted-foreground mb-1">TIẾN TRÌNH</p>
              <p className="text-2xl font-bold text-gray-900">{currentStep}/4</p>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 pb-8">
          {/* Mobile step indicator */}
          <div className="lg:hidden flex gap-1 mb-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  step.id <= currentStep ? "bg-primary-600" : "bg-gray-200"
                )}
              />
            ))}
          </div>

          {currentStep === 1 && <Step1BasicInfo formData={formData} update={update} />}
          {currentStep === 2 && <Step2Media formData={formData} update={update} />}
          {currentStep === 3 && <Step3Pricing formData={formData} update={update} />}
          {currentStep === 4 && <Step4Review formData={formData} />}

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            {currentStep > 1 ? (
              <Button variant="ghost" onClick={() => setCurrentStep((s) => s - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Quay lại
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => router.push("/teacher/courses")}>
                Hủy bỏ
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft} disabled={createCourse.isPending}>
                Lưu nháp
              </Button>
              {currentStep === 4 ? (
                <Button onClick={handlePublish} disabled={createCourse.isPending}>
                  {createCourse.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                  Hoàn tất & Xuất bản
                </Button>
              ) : (
                <Button onClick={() => setCurrentStep((s) => s + 1)} disabled={!canGoNext()}>
                  Tiếp tục bước kế tiếp
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 1: Basic Info
// ═══════════════════════════════════════════════════════════════════════════════

function Step1BasicInfo({
  formData,
  update,
}: {
  formData: CourseFormData;
  update: <K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) => void;
}) {
  const { data: categoriesRaw } = useCategoryList();
  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Thiết lập thông tin cốt lõi cho khóa học của bạn
        </p>
      </div>

      {/* Course Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Tên khóa học <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Ví dụ: Thiết kế UI/UX nâng cao"
          value={formData.title}
          onChange={(e) => update("title", e.target.value)}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Đường dẫn khóa học (slug) sẽ được tạo tự động từ tên này.
        </p>
      </div>

      {/* Format */}
      <div className="space-y-3">
        <Label>
          Định dạng giảng dạy <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FORMATS.map((format) => {
            const Icon = format.icon;
            const selected = formData.format === format.id;
            return (
              <button
                key={format.id}
                type="button"
                onClick={() => update("format", format.id)}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all text-center",
                  selected
                    ? "border-primary-500 bg-primary-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center",
                    selected ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-400"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-medium text-sm">{format.label}</p>
                <p className="text-xs text-muted-foreground leading-tight">{format.description}</p>
                {selected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category + Level */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Danh mục</Label>
          <Select value={formData.category_id} onValueChange={(v) => update("category_id", v)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Trình độ</Label>
          <Select value={formData.level} onValueChange={(v) => update("level", v)}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Short Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Mô tả ngắn</Label>
          <span className="text-xs text-muted-foreground">
            {formData.short_description.length}/200
          </span>
        </div>
        <Textarea
          placeholder="Tóm tắt ngắn gọn nội dung khóa học để thu hút học viên..."
          value={formData.short_description}
          onChange={(e) => update("short_description", e.target.value)}
          maxLength={200}
          rows={3}
        />
      </div>

      {/* Language */}
      <div className="space-y-2">
        <Label>Ngôn ngữ</Label>
        <Select value={formData.language} onValueChange={(v) => update("language", v)}>
          <SelectTrigger className="h-11 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vi">Tiếng Việt</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 2: Media & Description
// ═══════════════════════════════════════════════════════════════════════════════

function Step2Media({
  formData,
  update,
}: {
  formData: CourseFormData;
  update: <K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) => void;
}) {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const videoUpload = useVideoUpload();

  // Shared thumbnail processing (used by both click & drag-drop)
  const processThumbnail = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh (JPG, PNG)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    update("thumbnail_file", file);
    update("thumbnail_preview", previewUrl);

    setThumbnailUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post<{ message: string; data: { url: string } }>("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      update("thumbnail_url", res.data.data.url);
      toast.success("Tải ảnh bìa thành công");
    } catch {
      // Preview still works, URL just won't be set — user can retry or paste URL later
      toast.error("Tải ảnh bìa thất bại, nhưng ảnh xem trước vẫn hiển thị");
    } finally {
      setThumbnailUploading(false);
    }
  }, [update]);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processThumbnail(file);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processThumbnail(file);
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Vui lòng chọn file video");
      return;
    }

    update("preview_video_file", file);

    const uploadId = await videoUpload.upload(file, "course_preview", "preview_video");
    if (uploadId) {
      update("video_upload_id", uploadId);
      update("preview_video_url", `/videos/${uploadId}`);
    }
  };

  const removeThumbnail = () => {
    update("thumbnail_file", null);
    update("thumbnail_preview", "");
    update("thumbnail_url", "");
  };

  const removeVideo = () => {
    update("preview_video_file", null);
    update("preview_video_url", "");
    update("video_upload_id", "");
    videoUpload.reset();
  };

  // List helpers for objectives/requirements/target_audience
  const updateList = (field: "objectives" | "requirements" | "target_audience", index: number, value: string) => {
    const list = [...formData[field]];
    list[index] = value;
    update(field, list);
  };

  const addToList = (field: "objectives" | "requirements" | "target_audience") => {
    update(field, [...formData[field], ""]);
  };

  const removeFromList = (field: "objectives" | "requirements" | "target_audience", index: number) => {
    if (formData[field].length <= 1) return;
    update(field, formData[field].filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Hình ảnh & Mô tả</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Thêm ảnh bìa, video giới thiệu và mô tả chi tiết
        </p>
      </div>

      {/* Thumbnail Upload */}
      <div className="space-y-2">
        <Label>
          Ảnh bìa khóa học <span className="text-red-500">*</span>
        </Label>
        <input
          ref={thumbnailInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleThumbnailSelect}
        />

        {formData.thumbnail_preview ? (
          <div className="relative rounded-xl overflow-hidden border bg-gray-100 aspect-video max-w-md">
            <Image
              src={formData.thumbnail_preview}
              alt="Thumbnail preview"
              fill
              className="object-cover"
            />
            {thumbnailUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            <button
              onClick={removeThumbnail}
              className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
            {formData.thumbnail_url && (
              <div className="absolute bottom-2 left-2">
                <Badge className="bg-green-600 text-white text-xs">Đã tải lên</Badge>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => thumbnailInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "w-full max-w-md aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer",
              isDragging
                ? "border-primary-500 bg-primary-100/60 scale-[1.02]"
                : "hover:border-primary-400 hover:bg-primary-50/50"
            )}
          >
            <ImageIcon className={cn("w-10 h-10", isDragging ? "text-primary-600" : "text-muted-foreground")} />
            <p className="text-sm font-medium">
              {isDragging ? "Thả ảnh vào đây!" : "Kéo thả ảnh hoặc click để chọn"}
            </p>
            <p className="text-xs text-muted-foreground">
              1280x720px khuyến nghị. JPG, PNG. Tối đa 5MB
            </p>
          </button>
        )}
      </div>

      {/* Video Upload */}
      <div className="space-y-2">
        <Label>Video giới thiệu</Label>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleVideoSelect}
        />

        {formData.preview_video_file || videoUpload.isUploading ? (
          <div className="max-w-md border rounded-xl p-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Film className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {formData.preview_video_file?.name || "Video"}
                </p>
                {videoUpload.isUploading ? (
                  <div className="mt-1.5">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full transition-all"
                        style={{ width: `${videoUpload.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Đang tải lên... {videoUpload.progress}%
                    </p>
                  </div>
                ) : videoUpload.uploadId ? (
                  <p className="text-xs text-green-600 mt-0.5">Tải lên thành công</p>
                ) : videoUpload.error ? (
                  <p className="text-xs text-red-500 mt-0.5">Lỗi: {videoUpload.error.message}</p>
                ) : null}
              </div>
              <button
                onClick={removeVideo}
                className="w-8 h-8 text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 max-w-md">
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary-400 hover:bg-primary-50/50 transition-colors cursor-pointer"
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <p className="text-sm font-medium">Tải video lên</p>
              <p className="text-xs text-muted-foreground">MP4, WebM. Tối đa 500MB</p>
            </button>
            <div className="flex items-center text-xs text-muted-foreground">hoặc</div>
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Dán URL video YouTube..."
                value={formData.preview_video_url}
                onChange={(e) => update("preview_video_url", e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">YouTube, Vimeo</p>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>
          Mô tả chi tiết <span className="text-red-500">*</span>
        </Label>
        <Textarea
          placeholder="Mô tả chi tiết khóa học: nội dung sẽ học, phương pháp giảng dạy, kết quả đạt được..."
          value={formData.description}
          onChange={(e) => update("description", e.target.value)}
          rows={6}
          className="resize-y"
        />
      </div>

      {/* Objectives */}
      <div className="space-y-3">
        <Label>Bạn sẽ học được gì</Label>
        {formData.objectives.map((obj, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder={`Mục tiêu ${i + 1}`}
              value={obj}
              onChange={(e) => updateList("objectives", i, e.target.value)}
            />
            {formData.objectives.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeFromList("objectives", i)}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addToList("objectives")} className="gap-1">
          <Plus className="w-3 h-3" /> Thêm mục tiêu
        </Button>
      </div>

      {/* Requirements */}
      <div className="space-y-3">
        <Label>Yêu cầu tiên quyết</Label>
        {formData.requirements.map((req, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder={`Yêu cầu ${i + 1}`}
              value={req}
              onChange={(e) => updateList("requirements", i, e.target.value)}
            />
            {formData.requirements.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeFromList("requirements", i)}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addToList("requirements")} className="gap-1">
          <Plus className="w-3 h-3" /> Thêm yêu cầu
        </Button>
      </div>

      {/* Target Audience */}
      <div className="space-y-3">
        <Label>Đối tượng phù hợp</Label>
        {formData.target_audience.map((ta, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder={`Đối tượng ${i + 1}`}
              value={ta}
              onChange={(e) => updateList("target_audience", i, e.target.value)}
            />
            {formData.target_audience.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeFromList("target_audience", i)}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addToList("target_audience")} className="gap-1">
          <Plus className="w-3 h-3" /> Thêm đối tượng
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 3: Pricing
// ═══════════════════════════════════════════════════════════════════════════════

function Step3Pricing({
  formData,
  update,
}: {
  formData: CourseFormData;
  update: <K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) => void;
}) {
  const price = parseFloat(formData.price) || 0;
  const salePrice = parseFloat(formData.discount_price) || 0;
  const discount = price > 0 && salePrice > 0 && salePrice < price
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Cài đặt giá</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Thiết lập chi phí và chương trình ưu đãi cho khóa học
        </p>
      </div>

      {/* Pricing Type */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium">Cấu hình giá</h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => update("is_free", true)}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-all",
                formData.is_free
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <p className="font-medium">Miễn phí</p>
              <p className="text-sm text-muted-foreground">Tất cả đều có thể học</p>
            </button>
            <button
              type="button"
              onClick={() => update("is_free", false)}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-all",
                !formData.is_free
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">Có phí</p>
                  <p className="text-sm text-muted-foreground">Thu phí ghi danh</p>
                </div>
                {!formData.is_free && <Check className="w-5 h-5 text-primary-600 shrink-0" />}
              </div>
            </button>
          </div>

          {!formData.is_free && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label>Giá bán (VNĐ)</Label>
                <Input
                  type="number"
                  placeholder="1200000"
                  value={formData.price}
                  onChange={(e) => update("price", e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Giá khuyến mãi (VNĐ)</Label>
                <Input
                  type="number"
                  placeholder="890000"
                  value={formData.discount_price}
                  onChange={(e) => update("discount_price", e.target.value)}
                  className="h-11"
                />
                {discount > 0 && (
                  <p className="text-xs text-green-600 font-medium">
                    Giảm {discount}%
                  </p>
                )}
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Hết hạn khuyến mãi</Label>
                <Input
                  type="datetime-local"
                  value={formData.discount_expires_at}
                  onChange={(e) => update("discount_expires_at", e.target.value)}
                  className="h-11 w-64"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Featured */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Khóa học nổi bật</p>
              <p className="text-sm text-muted-foreground">
                Hiển thị trên trang chủ để tăng tiếp cận
              </p>
            </div>
            <Switch
              checked={formData.is_featured}
              onCheckedChange={(v) => update("is_featured", v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 4: Review & Complete
// ═══════════════════════════════════════════════════════════════════════════════

function Step4Review({ formData }: { formData: CourseFormData }) {
  const formatLabel = FORMATS.find((f) => f.id === formData.format)?.label ?? formData.format;
  const levelLabel = LEVELS.find((l) => l.value === formData.level)?.label ?? formData.level;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Xác nhận & Hoàn tất</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kiểm tra lại thông tin trước khi xuất bản khóa học
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium text-lg">{formData.title || "(Chưa đặt tên)"}</h3>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Định dạng:</span>
              <span className="ml-2 font-medium">{formatLabel}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Trình độ:</span>
              <span className="ml-2 font-medium">{levelLabel}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ngôn ngữ:</span>
              <span className="ml-2 font-medium">{formData.language === "vi" ? "Tiếng Việt" : "English"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Giá:</span>
              <span className="ml-2 font-medium">
                {formData.is_free
                  ? "Miễn phí"
                  : formData.price
                    ? `${parseInt(formData.price).toLocaleString("vi-VN")}đ`
                    : "Chưa thiết lập"}
              </span>
            </div>
          </div>

          {formData.short_description && (
            <div>
              <span className="text-sm text-muted-foreground">Mô tả ngắn:</span>
              <p className="text-sm mt-1">{formData.short_description}</p>
            </div>
          )}

          {formData.thumbnail_preview && (
            <div>
              <span className="text-sm text-muted-foreground">Ảnh bìa:</span>
              <div className="mt-2 relative rounded-lg overflow-hidden aspect-video max-w-xs bg-gray-100">
                <Image src={formData.thumbnail_preview} alt="Thumbnail" fill className="object-cover" />
              </div>
            </div>
          )}

          {formData.objectives.filter(Boolean).length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Mục tiêu học tập:</span>
              <ul className="mt-1 text-sm space-y-1">
                {formData.objectives.filter(Boolean).map((o, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist & Next steps — side by side */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:divide-x">
            {/* Left: Checklist */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Kiểm tra</h3>
              <ChecklistItem done={!!formData.title} label="Tên khóa học" />
              <ChecklistItem done={!!formData.thumbnail_url} label="Ảnh bìa" />
              <ChecklistItem done={!!formData.description} label="Mô tả chi tiết" />
              <ChecklistItem done={formData.is_free || !!formData.price} label="Thiết lập giá" />
              <ChecklistItem done={formData.objectives.some(Boolean)} label="Mục tiêu học tập" />
            </div>

            {/* Right: Next steps */}
            <div className="sm:pl-6 space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Bước tiếp theo</h3>
              <div className="relative pl-5">
                <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-gray-200" />
                {[
                  { title: "Thêm chương", desc: "Section" },
                  { title: "Tạo bài học", desc: "Lesson" },
                  { title: "Upload nội dung", desc: "Video, Quiz, Code" },
                  { title: "Mở lớp học", desc: "Mời học viên" },
                ].map((item, i) => (
                  <div key={i} className="relative pb-3 last:pb-0">
                    <div className="absolute -left-5 top-[3px] w-[11px] h-[11px] rounded-full border-2 border-gray-300 bg-white" />
                    <p className="text-sm text-gray-900">{item.title} <span className="text-muted-foreground">— {item.desc}</span></p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
          done ? "bg-green-500" : "bg-gray-200"
        )}
      >
        {done && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className={cn("text-sm", done ? "text-gray-900" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );
}
