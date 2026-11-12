"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useDeleteCourse } from "@/hooks/queries/use-courses";

/**
 * QA-B-05: trang chi tiết khoá từng không có nút xoá, khoá nháp rác chỉ xoá được bằng icon rê chuột ở danh
 * sách. Chỉ hiện cho bản nháp (backend chặn xoá khoá chờ duyệt; khoá đã bán thì có học viên).
 */
export function DeleteDraftCourseButton({ courseId, title, status }: { courseId: string; title: string; status?: string }) {
  const [open, setOpen] = useState(false);
  if (status !== "draft") return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="w-4 h-4 mr-1" /> Xoá bản nháp
      </Button>
      {/* Chỉ dựng hộp thoại (và hook xoá) khi mở, để trang chi tiết không tạo thêm mutation khi không cần. */}
      {open && <ConfirmDeleteDraft courseId={courseId} title={title} onClose={() => setOpen(false)} />}
    </>
  );
}

function ConfirmDeleteDraft({ courseId, title, onClose }: { courseId: string; title: string; onClose: () => void }) {
  const router = useRouter();
  const deleteCourse = useDeleteCourse();
  return (
    <ConfirmDialog
      open
      onOpenChange={(next) => {
        if (!next && !deleteCourse.isPending) onClose();
      }}
      title="Xoá khoá học?"
      description={`Khoá "${title}" sẽ bị xoá và không khôi phục được.`}
      confirmLabel="Xoá khoá học"
      destructive
      pending={deleteCourse.isPending}
      onConfirm={() =>
        deleteCourse.mutate(courseId, {
          onSuccess: () => router.push("/teacher/courses"),
          onSettled: onClose,
        })
      }
    />
  );
}
