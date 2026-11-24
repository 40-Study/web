"use client";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import type { LessonContent } from "@/services/lesson-content.service";

/** Nhãn loại nội dung dùng trong câu hỏi xác nhận ("Xoá trắc nghiệm?"). */
const TYPE_NOUN: Record<string, string> = {
  video: "video",
  livestream: "buổi học trực tiếp",
  exercise: "bài tập code",
  article: "bài viết",
  quiz: "bài trắc nghiệm",
};

interface DeleteLessonContentDialogProps {
  content: LessonContent | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (content: LessonContent) => void;
}

/**
 * Q4-T02: nút X cạnh nội dung bài học từng xoá ngay khi bấm (một cú bấm nhầm là mất cả bài trắc nghiệm cùng câu
 * hỏi). Nay luôn hỏi lại trước khi gửi DELETE.
 */
export function DeleteLessonContentDialog({ content, pending, onCancel, onConfirm }: DeleteLessonContentDialogProps) {
  const noun = content ? (TYPE_NOUN[content.type] ?? "nội dung") : "nội dung";
  const extra = content?.type === "quiz" ? " cùng toàn bộ câu hỏi" : content?.type === "exercise" ? " cùng các test case" : "";
  return (
    <ConfirmDialog
      open={content !== null}
      onOpenChange={(next) => {
        if (!next && !pending) onCancel();
      }}
      title={`Xoá ${noun}?`}
      description={content ? `"${content.title}"${extra} sẽ bị xoá khỏi bài học và không khôi phục được.` : undefined}
      confirmLabel="Xoá nội dung"
      destructive
      pending={pending}
      onConfirm={() => content && onConfirm(content)}
    />
  );
}
