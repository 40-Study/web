"use client";

/**
 * Xác nhận trước khi nộp bài kiểm tra trong bài học khi còn câu chưa trả lời (QA4 S2).
 * Cùng khuôn với hộp xác nhận của trình làm bài cuộc thi (contest-player).
 */

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QuizSubmitConfirmDialogProps {
  open: boolean;
  unansweredCount: number;
  totalQuestions: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function QuizSubmitConfirmDialog({
  open,
  unansweredCount,
  totalQuestions,
  onOpenChange,
  onConfirm,
}: QuizSubmitConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nộp bài khi còn câu chưa trả lời?</DialogTitle>
          <DialogDescription>
            Còn {unansweredCount}/{totalQuestions} câu chưa trả lời. Câu bỏ trống được tính là sai, và lượt làm chính
            thức sẽ bị trừ vào số lần làm bài.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Làm tiếp
          </Button>
          <Button onClick={onConfirm}>Vẫn nộp bài</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
