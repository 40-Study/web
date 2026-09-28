"use client";

/**
 * /teacher/courses/[id]/edit — sửa thông tin khoá (mô tả, giá, ảnh, trình độ...).
 *
 * QA vòng 2, D1 (P1): trang này trước đây chỉ redirect về trang chi tiết, nút "Tiếp tục sửa" ở
 * danh sách khoá dẫn vào ngõ cụt. Q5: khoá đang chờ duyệt thì KHÔNG sửa được — hiện hướng dẫn và
 * nút "Rút yêu cầu duyệt" (khoá về nháp rồi form mới mở).
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourse } from "@/hooks/queries/use-courses";
import { useWithdrawCourseReview } from "@/hooks/queries/use-course-approval";
import { useAuthStore } from "@/stores/auth.store";
import { CourseStatusBadge } from "@/components/teacher/course-review-status";
import { CourseEditForm } from "../../_components/course-edit-form";

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto mt-16 text-center space-y-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      {children}
    </div>
  );
}

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const { data: course, isLoading, isError } = useCourse(id);
  const withdrawReview = useWithdrawCourseReview();
  const teacherId = useAuthStore((s) => s.user?.id);
  const isAdmin = useAuthStore((s) => s.activeRole) === "SYSTEM_ADMIN";

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Backend trả 404 cả khi khoá nháp thuộc giảng viên khác (D4) — cùng một thông báo.
  if (isError || !course) {
    return (
      <Notice title="Không tìm thấy khoá học">
        <p className="text-sm text-muted-foreground">Khoá học không tồn tại hoặc bạn không có quyền xem.</p>
        <Button asChild>
          <Link href="/teacher/courses">Về Khóa học của tôi</Link>
        </Button>
      </Notice>
    );
  }

  if (!isAdmin && course.instructor_id !== teacherId) {
    return (
      <Notice title="Không có quyền truy cập">
        <p className="text-sm text-muted-foreground">Bạn không phải giảng viên phụ trách khóa học này.</p>
        <Button asChild>
          <Link href="/teacher/courses">Về Khóa học của tôi</Link>
        </Button>
      </Notice>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
          <Link href={`/teacher/courses/${course.id}`} aria-label="Quay lại khoá học">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">Sửa thông tin khoá học</h1>
            <CourseStatusBadge status={course.status} />
          </div>
          <p className="text-sm text-muted-foreground truncate">{course.title}</p>
        </div>
      </div>

      {course.status === "pending_review" ? (
        <div
          role="status"
          data-testid="edit-locked-pending"
          className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800"
        >
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Khoá học đang chờ quản trị viên duyệt nên tạm thời không thể chỉnh sửa. Muốn sửa, hãy rút
              yêu cầu duyệt: khoá học trở về bản nháp và bạn gửi duyệt lại sau khi sửa xong.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => withdrawReview.mutate(course.id)}
            isLoading={withdrawReview.isPending}
            disabled={withdrawReview.isPending}
            data-testid="withdraw-review"
          >
            Rút yêu cầu duyệt
          </Button>
        </div>
      ) : (
        // key: sau khi rút yêu cầu duyệt, khoá đổi trạng thái -> dựng lại form từ dữ liệu mới.
        <CourseEditForm key={`${course.id}-${course.status}`} course={course} />
      )}
    </div>
  );
}
