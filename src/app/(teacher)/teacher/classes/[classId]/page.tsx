"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { ClassManagePanel } from "@/components/classes/class-manage-panel";
import { ClassAssignmentsList } from "@/components/classes/class-assignments-list";
import { useClassById } from "@/hooks/queries/use-class-manage";

/**
 * Quản lý một lớp của giảng viên: kích hoạt, gán/gỡ giảng viên, ghi danh/gỡ học viên, lịch học.
 * Nút quay lại về danh sách lớp (/teacher/classes); mở từ trang khoá học (`?from=course`) thì về khoá học đó.
 * `?tab=schedule` mở thẳng tab "Lịch học" (đường dẫn từ trang điểm danh khi lớp chưa có buổi học).
 */
export default function TeacherClassManagePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classId = String(params.classId ?? "");
  const { data: cls } = useClassById(classId);

  const backToCourse = searchParams.get("from") === "course" && !!cls?.course_id;
  const backHref = backToCourse ? `/teacher/courses/${cls?.course_id}` : "/teacher/classes";
  const backLabel = backToCourse ? "Khoá học của lớp" : "Lớp học của tôi";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {backLabel}
        </Link>
        <Link
          href={`/teacher/classes/${classId}/attendance`}
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:border-primary-300 hover:text-primary-600"
        >
          <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> Điểm danh
        </Link>
      </div>
      <ClassManagePanel classId={classId} initialTab={searchParams.get("tab") === "schedule" ? "schedule" : "members"} />
      {/* QA-B-08: bài tập gắn với lớp đã có trong DB nhưng trang lớp không có lối vào; mỗi bài dẫn tới trang bài nộp. */}
      <ClassAssignmentsList classId={classId} hrefFor={(id) => `/teacher/assignments/${id}/submissions`} />
    </div>
  );
}
