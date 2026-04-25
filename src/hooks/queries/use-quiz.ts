/**
 * Quiz hooks for lesson quiz functionality
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quizService, type StartQuizResponse, type SubmitQuizDTO, type QuizAttempt } from "@/services/quiz.service";

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const quizKeys = {
  all: ["quizzes"] as const,
  byId: (id: string) => [...quizKeys.all, id] as const,
  byLesson: (lessonId: string) => [...quizKeys.all, "lesson", lessonId] as const,
  questions: (quizId: string) => [...quizKeys.all, quizId, "questions"] as const,
  attempts: (quizId: string) => [...quizKeys.all, quizId, "attempts"] as const,
  attemptProgress: (attemptId: string) => ["attempt", attemptId, "progress"] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Get quiz by ID */
export function useQuiz(quizId: string | undefined) {
  return useQuery({
    queryKey: quizKeys.byId(quizId!),
    queryFn: () => quizService.getById(quizId!),
    enabled: !!quizId,
  });
}

/** Get quizzes by lesson ID */
export function useQuizzesByLesson(lessonId: string | undefined) {
  return useQuery({
    queryKey: quizKeys.byLesson(lessonId!),
    queryFn: () => quizService.getByLesson(lessonId!),
    enabled: !!lessonId,
  });
}

/** Get quiz questions (for teacher/admin viewing) */
export function useQuizQuestions(quizId: string | undefined) {
  return useQuery({
    queryKey: quizKeys.questions(quizId!),
    queryFn: () => quizService.getQuestions(quizId!),
    enabled: !!quizId,
  });
}

/** Get my attempts for a quiz */
export function useMyQuizAttempts(quizId: string | undefined) {
  return useQuery({
    queryKey: quizKeys.attempts(quizId!),
    queryFn: () => quizService.getMyAttempts(quizId!),
    enabled: !!quizId,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Start a quiz attempt */
export function useStartQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quizId: string) => quizService.startQuiz(quizId),
    onSuccess: (data, quizId) => {
      // Invalidate attempts list
      queryClient.invalidateQueries({ queryKey: quizKeys.attempts(quizId) });
    },
  });
}

/** Submit quiz answers */
export function useSubmitQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quizId, data }: { quizId: string; data: SubmitQuizDTO }) =>
      quizService.submitQuiz(quizId, data),
    onSuccess: (result, { quizId }) => {
      // Invalidate attempts list
      queryClient.invalidateQueries({ queryKey: quizKeys.attempts(quizId) });
    },
  });
}

/** Save answer in progress (auto-save) */
export function useSaveQuizAnswer() {
  return useMutation({
    mutationFn: ({ attemptId, questionId, selectedAnswerIds, textAnswer }: {
      attemptId: string;
      questionId: string;
      selectedAnswerIds?: string[];
      textAnswer?: string;
    }) => quizService.saveAnswer(attemptId, {
      question_id: questionId,
      selected_answer_ids: selectedAnswerIds,
      text_answer: textAnswer,
    }),
  });
}

// ─── Combined Hook for Quiz Lesson ───────────────────────────────────────────

export interface UseQuizLessonOptions {
  lessonId: string;
  onQuizStarted?: (response: StartQuizResponse) => void;
  onQuizSubmitted?: (result: QuizAttempt) => void;
  onError?: (error: Error) => void;
}

/**
 * Combined hook for quiz lesson - handles fetching quiz and managing attempts
 */
export function useQuizLesson({ lessonId, onQuizStarted, onQuizSubmitted, onError }: UseQuizLessonOptions) {
  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuizzesByLesson(lessonId);
  const quiz = quizzes?.[0]; // Assume one quiz per lesson for now

  const startQuizMutation = useStartQuiz();
  const submitQuizMutation = useSubmitQuiz();

  const startQuiz = async () => {
    if (!quiz?.id) return null;
    try {
      const response = await startQuizMutation.mutateAsync(quiz.id);
      onQuizStarted?.(response);
      return response;
    } catch (error) {
      onError?.(error as Error);
      return null;
    }
  };

  const submitQuiz = async (answers: Array<{ question_id: string; selected_answer_ids?: string[]; text_answer?: string }>) => {
    if (!quiz?.id) return null;
    try {
      const result = await submitQuizMutation.mutateAsync({
        quizId: quiz.id,
        data: { answers },
      });
      onQuizSubmitted?.(result);
      return result;
    } catch (error) {
      onError?.(error as Error);
      return null;
    }
  };

  return {
    quiz,
    isLoading: isLoadingQuizzes,
    isStarting: startQuizMutation.isPending,
    isSubmitting: submitQuizMutation.isPending,
    startQuiz,
    submitQuiz,
    startError: startQuizMutation.error,
    submitError: submitQuizMutation.error,
  };
}
