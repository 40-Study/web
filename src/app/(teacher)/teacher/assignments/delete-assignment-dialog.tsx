"use client";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import type { AssignmentResponseDTO } from "@/services/assignment.service";

interface DeleteAssignmentDialogProps {
  assignment: AssignmentResponseDTO | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (assignment: AssignmentResponseDTO) => void;
}

/**
 * Q4-T01: "Xoá" từng gửi DELETE ngay khi bấm, không hỏi lại, không hoàn tác. Nay luôn hỏi trước. Bài đã có học
 * viên nộp thì backend từ chối (409 ERR_ASSIGNMENT_HAS_SUBMISSIONS, câu tiếng Việt ở error-messages.ts).
 */
export function DeleteAssignmentDialog({ assignment, pending, onCancel, onConfirm }: DeleteAssignmentDialogProps) {
  return (
    <ConfirmDialog
      open={assignment !== null}
      onOpenChange={(next) => {
        if (!next && !pending) onCancel();
      }}
      title="Xoá bài tập?"
      description={
        assignment
          ? `Bài tập "${assignment.title}" sẽ bị xoá và không khôi phục được. Bài tập đã có học viên nộp bài thì không xoá được.`
          : undefined
      }
      confirmLabel="Xoá bài tập"
      destructive
      pending={pending}
      onConfirm={() => assignment && onConfirm(assignment)}
    />
  );
}
