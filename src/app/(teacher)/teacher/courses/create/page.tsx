"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCreateCourse } from "@/hooks/queries/use-courses";
import { toast } from "sonner";
import {
  LEVELS,
  initialCourseFormData as initialFormData,
  validateDiscountPrice,
  type CourseFormData,
} from "../_components/course-form-model";
import { CourseBasicInfoStep, FORMATS } from "../_components/course-basic-info-step";
import { CourseMediaStep } from "../_components/course-media-step";
import { CoursePricingStep } from "../_components/course-pricing-step";

// ─── Constants ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Thông tin cơ bản" },
  { id: 2, title: "Hình ảnh & Mô tả" },
  { id: 3, title: "Cài đặt giá" },
  { id: 4, title: "Hoàn tất" },
];

// ─── Main Page ──────────────────────────────────────────────────────────────

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
    // Bước "Cài đặt giá": không cho đi tiếp với giá khuyến mãi sai (lý do hiện ngay dưới ô nhập).
    if (currentStep === 3) return validateDiscountPrice(formData) === null;
    return true;
  };

  /** Lưu/tạo khoá chỉ khi giá khuyến mãi hợp lệ; sai thì quay lại bước giá và báo lý do. */
  const discountPriceOk = () => {
    const discountError = validateDiscountPrice(formData);
    if (discountError === null) return true;
    toast.error(discountError);
    setCurrentStep(3);
    return false;
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
    if (!discountPriceOk()) return;
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
    if (!discountPriceOk()) return;
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
      {/* Page Header — D7 (QA vòng 2): ở 390px, cụm nút phải + tiêu đề trên 1 hàng rộng 435px
          (nút "Tiếp tục" bị cắt). Mobile ẩn cụm nút này: thanh điều hướng cuối trang có đủ nút. */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex min-w-0 items-center gap-3">
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
        <div className="hidden gap-2 sm:flex">
          <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={createCourse.isPending}>
            {createCourse.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Lưu nháp
          </Button>
          {currentStep === 4 ? (
            <Button size="sm" onClick={handlePublish} disabled={createCourse.isPending}>
              Tạo khoá & thêm bài học
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

          {currentStep === 1 && <CourseBasicInfoStep formData={formData} update={update} />}
          {currentStep === 2 && <CourseMediaStep formData={formData} update={update} />}
          {currentStep === 3 && <CoursePricingStep formData={formData} update={update} />}
          {currentStep === 4 && <Step4Review formData={formData} />}

          {/* Bottom Navigation */}
          <div className="flex flex-col-reverse gap-3 mt-8 pt-6 border-t sm:flex-row sm:items-center sm:justify-between">
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
                  Tạo khoá & thêm bài học
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
          Kiểm tra lại thông tin trước khi tạo khoá học. Khoá học chỉ được xuất bản sau khi quản trị viên duyệt.
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
                <Image src={formData.thumbnail_preview} alt="Ảnh bìa khóa học" fill className="object-cover" />
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
