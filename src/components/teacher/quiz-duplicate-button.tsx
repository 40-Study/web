"use client";

import { useRef } from "react";
import { Copy, Loader2 } from "lucide-react";
import { useDuplicateQuizContent } from "@/hooks/queries/use-duplicate-quiz-content";

interface QuizDuplicateButtonProps {
  lessonId: string;
  quizId: string;
  /** `is_mandatory` của nội dung gốc; bản sao giữ nguyên. Vắng (dữ liệu cũ) = bắt buộc, mặc định của backend. */
  isMandatory?: boolean;
}

/** Nút nhân bản trên hàng nội dung `quiz` của bài học (QA2 Q2-03). */
export function QuizDuplicateButton({ lessonId, quizId, isMandatory = true }: QuizDuplicateButtonProps) {
  const duplicate = useDuplicateQuizContent(lessonId);
  // `isPending` của react-query cập nhật bất đồng bộ nên hai cú bấm sát nhau vẫn lọt qua `disabled`;
  // cờ ref chặn ngay lập tức để không tạo hai bản sao.
  const inFlight = useRef(false);
  const handleClick = () => {
    if (inFlight.current) return;
    inFlight.current = true;
    duplicate.mutate({ quizId, isMandatory }, { onSettled: () => (inFlight.current = false) });
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={duplicate.isPending}
      className="p-0.5 text-gray-400 hover:text-primary-600 disabled:opacity-50"
      title="Nhân bản bài trắc nghiệm"
      aria-label="Nhân bản bài trắc nghiệm"
    >
      {duplicate.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}
