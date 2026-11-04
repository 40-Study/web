/**
 * PUT /quizzes/:quizId/questions/:questionId — sửa câu hỏi của quiz đã tạo (QA3 Q3-16).
 * Tách file riêng vì `quiz.service.ts` thuộc lane khác trong đợt QA3; gộp vào đó khi tiện.
 */

import { api } from "@/lib/api-client";
import type { QuizQuestion } from "@/services/quiz.service";
import type { UpdateQuestionBody } from "@/lib/quiz-question-edit";

type R<T> = { message: string; data: T };

export const quizQuestionUpdateService = {
  update: (quizId: string, questionId: string, data: UpdateQuestionBody) =>
    api.put<R<QuizQuestion>>(`/quizzes/${quizId}/questions/${questionId}`, data).then((r) => r.data.data),
};
