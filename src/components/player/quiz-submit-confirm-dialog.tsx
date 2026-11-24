"use client";

/**
 * Xác nhận trước khi nộp bài kiểm tra trong bài học (QA4 S2, review #124). Hỏi khi còn câu chưa trả lời,
 * và luôn hỏi với lượt CHÍNH THỨC (tính vào số lần làm bài) kể cả khi đã trả lời đủ. Câu "tính vào số lần
 * làm bài" chỉ hiện cho lượt chính thức: lượt luyện tập không bị đếm. Cùng khuôn với hộp xác nhận của
 * trình làm bài cuộc thi (contest-player).
 */

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QuizSubmitConfirmDialogProps {
  open: boolean;
  unansweredCount: number;
  totalQuestions: number;
  /** Lượt chính thức: tính vào số lần làm bài. */
  countsTowardAttempts: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function QuizSubmitConfirmDialog({
  open,
  unansweredCount,
  totalQuestions,
  countsTowardAttempts,
  onOpenChange,
  onConfirm,
}: QuizSubmitConfirmDialogProps) {
  const hasBlanks = unansweredCount > 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasBlanks ? "Nộp bài khi còn câu chưa trả lời?" : "Nộp bài?"}</DialogTitle>
          <DialogDescription>
            {hasBlanks
              ? `Còn ${unansweredCount}/${totalQuestions} câu chưa trả lời. Câu bỏ trống được tính là sai.`
              : `Bạn đã trả lời đủ ${totalQuestions} câu. Sau khi nộp không sửa được nữa.`}
            {countsTowardAttempts && " Lượt làm chính thức này sẽ được tính vào số lần làm bài."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Làm tiếp
          </Button>
          <Button onClick={onConfirm}>{hasBlanks ? "Vẫn nộp bài" : "Nộp bài"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
