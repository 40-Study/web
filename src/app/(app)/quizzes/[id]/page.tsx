"use client";

/**
 * Trang quiz độc lập (contract §6) — vào từ link "Mở trang làm bài riêng" trong
 * player, hoặc chia sẻ trực tiếp. Cùng dữ liệu quiz với bản nhúng trong bài học,
 * nhưng có thêm màn chọn chế độ (`official` / `practice`) trước khi bắt đầu.
 *
 * Kết quả KHÔNG được dựng lại ở client — bấm nộp xong chuyển sang trang kết quả,
 * trang đó gọi `GET /quizzes/:id/attempts/:attemptId` để lấy đúng/sai + giải
 * thích từ server (contract §6: giải thích chỉ trả sau khi nộp).
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { QuizLessonContent } from "@/components/player";
import { QuizModePicker } from "@/components/quiz";
import {
  useQuiz,
  useMyQuizAttempts,
  useStartQuiz,
  useSubmitQuiz,
  useSaveQuizAnswer,
} from "@/hooks/queries/use-quiz";
import type { QuizMode, StartQuizResponse } from "@/services/quiz.service";

export default function StandaloneQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = String(params.id ?? "");

  const { data: quiz, isLoading: isLoadingQuiz, isError: isQuizError } = useQuiz(quizId);
  const { data: attempts } = useMyQuizAttempts(quizId);

  const [activeQuiz, setActiveQuiz] = useState<StartQuizResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const startQuizMutation = useStartQuiz();
  const submitQuizMutation = useSubmitQuiz();
  const saveAnswerMutation = useSaveQuizAnswer();

  const handleSelectMode = async (mode: QuizMode) => {
    setActionError(null);
    try {
      const response = await startQuizMutation.mutateAsync({ quizId, mode });
      setActiveQuiz(response);
    } catch (err: any) {
      setActionError(err?.message || "Không thể bắt đầu bài làm. Vui lòng thử lại.");
    }
  };

  const handleSaveAnswer = (questionId: string, answerIds: string[]) => {
    if (!activeQuiz) return;
    // Tự lưu để tránh mất câu trả lời nếu mất kết nối giữa chừng — lỗi lưu ở
    // đây không chặn người học, chỉ ảnh hưởng nếu họ rời trang trước khi nộp.
    saveAnswerMutation.mutate({
      attemptId: activeQuiz.attempt_id,
      questionId,
      selectedAnswerIds: answerIds,
    });
  };

  const handleSubmit = async (
    answers: Record<string, string> | Array<{ question_id: string; selected_answer_ids?: string[] }>
  ) => {
    if (!activeQuiz) return;
    // `apiQuiz` luôn gọi onSubmit với mảng {question_id, selected_answer_ids}.
    const apiAnswers = Array.isArray(answers) ? answers : [];
    try {
      const result = await submitQuizMutation.mutateAsync({
        quizId,
        data: { answers: apiAnswers },
      });
      router.push(`/quizzes/${quizId}/result?attempt=${result.id || activeQuiz.attempt_id}`);
    } catch (err: any) {
      setActionError(err?.message || "Không nộp được bài. Câu trả lời vẫn được lưu tạm, hãy thử nộp lại.");
    }
  };

  if (isLoadingQuiz) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" aria-hidden="true" />
      </div>
    );
  }

  if (isQuizError || !quiz) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-gray-600">Không tìm thấy bài kiểm tra này.</p>
        <Link href="/my-courses" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
          Về khoá học của tôi
        </Link>
      </div>
    );
  }

  if (activeQuiz) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <QuizLessonContent
          apiQuiz={activeQuiz}
          onSubmit={handleSubmit}
          onSaveAnswer={handleSaveAnswer}
          isSubmitting={submitQuizMutation.isPending}
        />
        {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <QuizModePicker
        title={quiz.title}
        attemptCount={attempts?.length}
        maxAttempts={quiz.max_attempts}
        onSelect={handleSelectMode}
        isStarting={startQuizMutation.isPending}
      />
      {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}
    </div>
  );
}
