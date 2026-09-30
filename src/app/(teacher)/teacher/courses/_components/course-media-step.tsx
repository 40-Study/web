"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Film, ImageIcon, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useVideoUpload } from "@/hooks/use-video-upload";
import type { CourseFormData, UpdateCourseFormField } from "./course-form-model";

/** Bước "Hình ảnh & Mô tả" — dùng chung trang tạo và trang sửa khoá. */
export function CourseMediaStep({
  formData,
  update,
}: {
  formData: CourseFormData;
  update: UpdateCourseFormField;
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
              alt="Xem trước ảnh bìa"
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
          // D7 (QA vòng 2): xếp dọc trên mobile — hàng ngang 3 khối tràn màn 390px.
          <div className="flex flex-col gap-3 max-w-md sm:flex-row">
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary-400 hover:bg-primary-50/50 transition-colors cursor-pointer"
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <p className="text-sm font-medium">Tải video lên</p>
              <p className="text-xs text-muted-foreground">MP4, WebM. Tối đa 500MB</p>
            </button>
            <div className="flex items-center justify-center text-xs text-muted-foreground">hoặc</div>
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
