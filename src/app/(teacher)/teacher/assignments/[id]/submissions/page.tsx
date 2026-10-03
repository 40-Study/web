"use client";

/**
 * Bài nộp của một bài tập. Toàn bộ phần chấm (xem bài, nhập điểm, nhận xét, người chấm) nằm trong
 * SubmissionGradingPanel để khu quản lý tổ chức dùng lại cùng một giao diện.
 *
 * Trước đây trang này có nút "Gửi nhắc nhở" nhưng không có API nào phía sau (chỉ chờ 1 giây rồi đóng hộp
 * thoại như thể đã gửi), nên đã gỡ thay vì giả vờ thành công.
 */

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Code2, FileQuestion, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAssignment } from "@/hooks/queries/use-assignments";
import { SubmissionGradingPanel } from "@/components/grading/submission-grading-panel";
import { formatDateTime } from "@/components/grading/submission-grade-dialog";

export default function AssignmentSubmissionsPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = params.id;
  const { data: assignment, isLoading } = useAssignment(assignmentId);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const assignmentType = assignment?.type || "homework";
  const TypeIcon =
    assignmentType === "live_coding" ? Code2 : assignmentType === "homework" ? FileQuestion : FileText;

  return (
    <div className="container max-w-6xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/assignments" aria-label="Quay lại danh sách bài tập">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        {assignment ? (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "rounded-lg p-2",
                assignmentType === "live_coding" && "bg-purple-100 text-purple-600",
                assignmentType === "homework" && "bg-blue-100 text-blue-600",
                assignmentType === "project" && "bg-orange-100 text-orange-600",
              )}
            >
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{assignment.title}</h1>
              <p className="text-sm text-muted-foreground">Hạn nộp: {formatDateTime(assignment.end_time)}</p>
            </div>
          </div>
        ) : (
          <h1 className="text-xl font-semibold">Bài nộp</h1>
        )}
      </div>

      <SubmissionGradingPanel assignmentId={assignmentId} />
    </div>
  );
}
