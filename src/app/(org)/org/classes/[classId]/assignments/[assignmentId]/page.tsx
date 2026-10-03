"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { SubmissionGradingPanel } from "@/components/grading/submission-grading-panel";
import { useAssignment } from "@/hooks/queries/use-assignments";

/**
 * Chấm bài của một bài tập thuộc lớp tổ chức. Toàn bộ giao diện chấm là SubmissionGradingPanel (dùng chung với
 * giảng viên); trang này chỉ thêm breadcrumb về lớp. Quyền do backend quyết: bài của lớp tổ chức khác là 404.
 */
export default function OrgAssignmentGradingPage() {
  const params = useParams();
  const classId = String(params.classId ?? "");
  const assignmentId = String(params.assignmentId ?? "");
  const { data: assignment } = useAssignment(assignmentId);

  return (
    <div className="space-y-6">
      <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/org/classes" className="hover:text-foreground">
          Lớp học
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <Link href={`/org/classes/${classId}`} className="hover:text-foreground">
          Chi tiết lớp
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span aria-current="page" className="truncate font-medium text-foreground">
          {assignment?.title ?? "Chấm bài"}
        </span>
      </nav>
      <SubmissionGradingPanel assignmentId={assignmentId} />
    </div>
  );
}
