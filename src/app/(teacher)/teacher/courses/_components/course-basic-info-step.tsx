"use client";

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
import { useCategoryList } from "@/hooks/queries/use-categories";
import { LEVELS, type CourseFormData, type UpdateCourseFormField } from "./course-form-model";

/**
 * Bước "Thông tin cơ bản" — dùng chung trang tạo và trang sửa khoá.
 * Q4-T04: bỏ ô "Định dạng giảng dạy" (Video/Livestream/Kết hợp): backend không có trường này nên lựa chọn không
 * được lưu. Buổi học trực tiếp là tính năng riêng (lịch dạy, nội dung livestream trong bài học).
 */
export function CourseBasicInfoStep({ formData, update }: { formData: CourseFormData; update: UpdateCourseFormField }) {
  const { data: categoriesRaw } = useCategoryList();
  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Thiết lập thông tin cốt lõi cho khoá học của bạn
        </p>
      </div>

      {/* Course Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Tên khoá học <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Ví dụ: Thiết kế UI/UX nâng cao"
          value={formData.title}
          onChange={(e) => update("title", e.target.value)}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Đường dẫn khoá học (slug) sẽ được tạo tự động từ tên này.
        </p>
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
          placeholder="Tóm tắt ngắn gọn nội dung khoá học để thu hút học viên..."
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
