"use client";

/**
 * Form sửa thông tin khoá học (QA vòng 2, D1). Dùng lại đúng các bước form của trang tạo khoá
 * (course-*-step.tsx) nhưng hiện cùng lúc trên 1 trang, điền sẵn từ khoá hiện có, lưu bằng
 * PUT /courses/:id (useUpdateCourse).
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUpdateCourse } from "@/hooks/queries/use-courses";
import { approvalErrorMessage } from "@/lib/approval-errors";
import type { ApiCourse } from "@/services/course.service";
import {
  buildCourseUpdatePayload,
  courseToFormData,
  type CourseFormData,
} from "./course-form-model";
import { CourseBasicInfoStep } from "./course-basic-info-step";
import { CourseMediaStep } from "./course-media-step";
import { CoursePricingStep } from "./course-pricing-step";

export function CourseEditForm({ course }: { course: ApiCourse }) {
  const router = useRouter();
  const updateCourse = useUpdateCourse();
  // Khởi tạo 1 lần từ khoá đang có — refetch nền không được ghi đè thứ người dùng đang gõ.
  const [formData, setFormData] = useState<CourseFormData>(() => courseToFormData(course));
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(<K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const backToCourse = () => router.push(`/teacher/courses/${course.id}`);

  function handleSave() {
    const result = buildCourseUpdatePayload(formData, course);
    if (result.error !== undefined) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    setError(null);
    updateCourse.mutate(
      { id: course.id, data: result.payload },
      {
        onSuccess: backToCourse,
        // Hook đã toast lỗi chung; hiện thêm lý do cụ thể (vd khoá vừa bị gửi duyệt ở tab khác).
        onError: (err) => setError(approvalErrorMessage(err, "Không thể lưu thay đổi, vui lòng thử lại.")),
      }
    );
  }

  return (
    <div className="space-y-6" data-testid="course-edit-form">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <CourseBasicInfoStep formData={formData} update={update} showFormat={false} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 sm:p-6">
          <CourseMediaStep formData={formData} update={update} />
        </CardContent>
      </Card>
      <CoursePricingStep formData={formData} update={update} showFeatured={false} />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Thanh lưu dính đáy màn hình: form dài, không bắt người dùng cuộn lên đầu mới lưu được. */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={backToCourse} disabled={updateCourse.isPending}>
            Huỷ
          </Button>
          <Button onClick={handleSave} isLoading={updateCourse.isPending} disabled={updateCourse.isPending}>
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}
