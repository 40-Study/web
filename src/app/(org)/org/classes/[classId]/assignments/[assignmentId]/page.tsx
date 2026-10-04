"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { QueryState } from "@/components/common/query-state";
import { SubmissionGradingPanel } from "@/components/grading/submission-grading-panel";
import { useAssignment } from "@/hooks/queries/use-assignments";

/**
 * Chấm bài của một bài tập thuộc lớp tổ chức. Toàn bộ giao diện chấm là SubmissionGradingPanel (dùng chung với
 * giảng viên); trang này chỉ thêm breadcrumb về lớp. Quyền do backend quyết: bài của lớp tổ chức khác là 404.
 *
 * Bài tập phải thuộc đúng lớp trên URL: lớp A + bài của lớp B (cùng tổ chức, backend cho phép cả hai) sẽ cho
 * breadcrumb nói lớp A trong khi bảng chấm là của lớp B, nên coi là không tìm thấy và KHÔNG render panel.
 */
export default function OrgAssignmentGradingPage() {
  const params = useParams();
  const classId = String(params.classId ?? "");
  const assignmentId = String(params.assignmentId ?? "");
  const { data: assignment } = useAssignment(assignmentId);

  const isMismatch = !!assignment && assignment.class_id !== classId;

  const breadcrumb = (
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
        {isMismatch ? "Chấm bài" : (assignment?.title ?? "Chấm bài")}
      </span>
    </nav>
  );

  if (isMismatch) {
    return (
      <div className="space-y-6">
        {breadcrumb}
        <QueryState
          isEmpty
          emptyTitle="Không tìm thấy bài tập"
          emptyDescription="Bài tập không thuộc lớp này hoặc không tồn tại."
        >
          {null}
        </QueryState>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {breadcrumb}
      <SubmissionGradingPanel assignmentId={assignmentId} />
    </div>
  );
}
