"use client";

/**
 * Dialog xem chi tiết (read-only) một khoá đang chờ duyệt — mô tả, giá, chương/bài.
 * Dữ liệu lấy từ route ĐÃ CÓ GET /courses/:id (admin được bypass khoá bài, contract phase3)
 * + danh sách chương/bài, để admin xem nội dung thật trước khi duyệt.
 */

import { useCourse } from "@/hooks/queries/use-courses";
import { useSections } from "@/hooks/queries/use-sections";
import { useLessons } from "@/hooks/queries/use-lessons";
import { QueryState } from "@/components/common/query-state";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import type { ApiCourse } from "@/services/course.service";

interface CourseReviewDetailDialogProps {
  courseId: string | null;
  onClose: () => void;
}

export function CourseReviewDetailDialog({ courseId, onClose }: CourseReviewDetailDialogProps) {
  return (
    <Dialog open={!!courseId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl" data-testid="course-detail-dialog">
        {courseId && <CourseDetailBody courseId={courseId} />}
      </DialogContent>
    </Dialog>
  );
}

function priceLabel(course: ApiCourse): string {
  if (course.is_free) return "Miễn phí";
  const price = Number(course.price) || 0;
  const discount = course.discount_price != null ? Number(course.discount_price) : 0;
  if (discount > 0 && discount < price) {
    return `${formatCurrency(discount)} (gốc ${formatCurrency(price)})`;
  }
  return price > 0 ? formatCurrency(price) : "Chưa đặt giá";
}

function CourseDetailBody({ courseId }: { courseId: string }) {
  const course = useCourse(courseId);
  const sections = useSections(courseId);

  return (
    <div className="max-h-[75vh] overflow-y-auto pr-1">
      <DialogTitle>{course.data?.title ?? "Chi tiết khoá học"}</DialogTitle>
      <QueryState
        isLoading={course.isLoading}
        isError={course.isError}
        error={course.error}
        onRetry={() => course.refetch()}
        className="mt-4"
      >
        {course.data && (
          <div className="mt-4 space-y-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <Info label="Giá" value={priceLabel(course.data)} />
              <Info label="Trình độ" value={course.data.level || "—"} />
            </div>
            {course.data.short_description && (
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {course.data.short_description}
              </p>
            )}
            <div>
              <h3 className="mb-1 font-semibold">Mô tả</h3>
              <p className="whitespace-pre-line text-gray-600 dark:text-gray-400">
                {course.data.description || "Giáo viên chưa nhập mô tả chi tiết."}
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Chương / bài học</h3>
              <QueryState
                isLoading={sections.isLoading}
                isError={sections.isError}
                error={sections.error}
                onRetry={() => sections.refetch()}
                isEmpty={(sections.data ?? []).length === 0}
                emptyTitle="Khoá học chưa có chương nào"
                emptyDescription="Cân nhắc từ chối nếu nội dung chưa đủ để xuất bản."
              >
                <ol className="space-y-2">
                  {(sections.data ?? []).map((section, index) => (
                    <li key={section.id} className="rounded-lg border p-3 dark:border-gray-800">
                      <p className="font-medium">
                        Chương {index + 1}: {section.title}
                      </p>
                      <SectionLessons courseId={courseId} sectionId={section.id} />
                    </li>
                  ))}
                </ol>
              </QueryState>
            </div>
          </div>
        )}
      </QueryState>
    </div>
  );
}

function SectionLessons({ courseId, sectionId }: { courseId: string; sectionId: string }) {
  const { data, isLoading, isError } = useLessons(courseId, sectionId);
  if (isLoading) return <p className="mt-1 text-xs text-gray-400">Đang tải bài học…</p>;
  if (isError) return <p className="mt-1 text-xs text-red-500">Không tải được danh sách bài học.</p>;
  if (!data || data.length === 0) return <p className="mt-1 text-xs text-gray-400">Chưa có bài học.</p>;
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-gray-600 dark:text-gray-400">
      {data.map((lesson) => (
        <li key={lesson.id}>
          {lesson.title}
          {lesson.duration_minutes ? ` · ${lesson.duration_minutes} phút` : ""}
        </li>
      ))}
    </ul>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
