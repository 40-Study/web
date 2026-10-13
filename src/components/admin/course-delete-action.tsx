"use client";

/**
 * Nút "Xoá" khoá học cho admin (hàng của /admin/courses). Dùng chung `useDeleteCourse` với phía giáo viên nên
 * 409 COURSE_HAS_ENROLLMENTS hiện thông báo tiếng Việt kèm nút "Lưu trữ", 409 COURSE_PENDING_REVIEW cũng vậy.
 */

import { useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useDeleteCourse } from "@/hooks/queries/use-courses";

interface CourseDeleteActionProps {
  courseId: string;
  title: string;
  className?: string;
}

export function CourseDeleteAction({ courseId, title, className }: CourseDeleteActionProps) {
  const [open, setOpen] = useState(false);
  const deleteCourse = useDeleteCourse();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} data-testid="course-delete" className={className}>
        Xoá
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Xoá khoá học"
        description={
          <>
            Xoá vĩnh viễn khoá <strong>{title}</strong> cùng các chương và bài kiểm tra? Khoá đã có học viên ghi
            danh không xoá được — khi đó hãy chọn &quot;Lưu trữ&quot;.
          </>
        }
        confirmLabel="Xoá khoá học"
        destructive
        pending={deleteCourse.isPending}
        onConfirm={() => deleteCourse.mutate(courseId, { onSettled: () => setOpen(false) })}
      />
    </>
  );
}
