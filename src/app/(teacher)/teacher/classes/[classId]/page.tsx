"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { ClassManagePanel } from "@/components/classes/class-manage-panel";

/** Quản lý một lớp của giảng viên: kích hoạt, gán/gỡ giảng viên, ghi danh/gỡ học viên. */
export default function TeacherClassManagePage() {
  const params = useParams();
  const classId = String(params.classId ?? "");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/teacher/courses"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Khoá học của tôi
        </Link>
        <Link
          href={`/teacher/classes/${classId}/attendance`}
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:border-primary-300 hover:text-primary-600"
        >
          <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> Điểm danh
        </Link>
      </div>
      <ClassManagePanel classId={classId} />
    </div>
  );
}
