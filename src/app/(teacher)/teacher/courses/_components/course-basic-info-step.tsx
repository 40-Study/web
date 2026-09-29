"use client";

import { Check, Layers, Play, Radio } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCategoryList } from "@/hooks/queries/use-categories";
import { LEVELS, type CourseFormData, type UpdateCourseFormField } from "./course-form-model";

export const FORMATS = [
  { id: "video", label: "Video Quay Sẵn", description: "Học qua video bài giảng", icon: Play },
  { id: "livestream", label: "Livestream", description: "Học trực tiếp qua Zoom/Meet", icon: Radio },
  { id: "hybrid", label: "Hybrid (Kết hợp)", description: "Video & Buổi học trực tiếp", icon: Layers },
];

/** Bước "Thông tin cơ bản" — dùng chung trang tạo và trang sửa khoá. */
export function CourseBasicInfoStep({
  formData,
  update,
  showFormat = true,
}: {
  formData: CourseFormData;
  update: UpdateCourseFormField;
  // Định dạng giảng dạy chưa được lưu ở backend — chỉ hiện ở trang tạo (giữ hành vi cũ).
  showFormat?: boolean;
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
      {showFormat && (
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
      )}

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
