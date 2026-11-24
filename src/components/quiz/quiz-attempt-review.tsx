"use client";

/**
 * Xem lại bài đã nộp (contract §6) — mỗi câu kèm giải thích đáp án.
 *
 * Backend CHỈ trả `explanation` sau khi nộp (`GET /quizzes/:id/attempts/:attemptId`),
 * nên component này là màn duy nhất được phép hiển thị giải thích. Trước khi nộp
 * không có dữ liệu này và cũng không được bịa ra.
 *
 * Response kết quả không kèm chữ của đáp án, chỉ có id. Nếu màn gọi có sẵn bảng
 * id → chữ (lấy từ `/quizzes/:id/questions`) thì hiện chữ; thiếu thì hiện nhãn
 * trung tính — KHÔNG BAO GIỜ lộ id thô ("Đáp án c1000000" khiến mọi lựa chọn
 * trông giống nhau, QA3 Q4).
 */

import { CheckCircle, XCircle, MinusCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { mergeAnswersWithQuestions, type QuestionLike } from "@/lib/quiz-attempt-summary";

export interface QuizReviewAnswer {
  question_id: string;
  question_text: string;
  selected_answer_ids: string[];
  correct_answer_ids?: string[] | null;
  is_correct?: boolean;
  points_earned: number;
  explanation?: string | null;
}

interface QuizAttemptReviewProps {
  answers: QuizReviewAnswer[];
  /**
   * Hợp đồng C10: giảng viên tắt "hiện đáp án" (`show_correct_answers=false`) thì backend trả
   * `answers_hidden: true`, `correct_answer_ids`/`explanation` = null. Khi đó không hiện dấu đúng/sai,
   * đáp án đúng hay giải thích, chỉ hiện việc có chọn hay chưa.
   */
  answersHidden?: boolean;
  /** id đáp án → chữ của đáp án; thiếu thì hiển thị nhãn trung tính. */
  answerText?: Map<string, string>;
  /** Đề của bài: có thì câu bỏ trống (không có trong `answers`) vẫn được liệt kê (QA4 S1). */
  questions?: ReadonlyArray<QuestionLike>;
  className?: string;
}

/** Thông báo thay cho đáp án đúng/giải thích khi giảng viên ẩn đáp án (C10). */
export const ANSWERS_HIDDEN_NOTICE = "Giảng viên đã ẩn đáp án của bài này";

/** Nhãn khi không tra được chữ của đáp án: trung tính, không chứa id. */
export const UNKNOWN_ANSWER_LABEL = "Đáp án không còn hiển thị";

function labelFor(id: string, answerText?: Map<string, string>): string {
  return answerText?.get(id) ?? UNKNOWN_ANSWER_LABEL;
}

export function QuizAttemptReview({
  answers: attemptAnswers,
  answerText,
  questions,
  answersHidden = false,
  className,
}: QuizAttemptReviewProps) {
  // Round 2 (R1, S5-11): sau khi nộp backend trả cả câu bỏ trống kèm đáp án đúng; slice rỗng của Go có thể về dạng
  // `null`, nên chuẩn hoá để "Bạn chọn: —" và "Đáp án đúng" vẫn hiện thay vì làm hỏng cả màn xem lại.
  const answers = mergeAnswersWithQuestions(attemptAnswers, questions).map((a) => ({
    ...a,
    selected_answer_ids: a.selected_answer_ids ?? [],
  }));
  if (answers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Chưa có dữ liệu chi tiết cho lần làm này.</p>
    );
  }

  return (
    <div className="space-y-3">
      {answersHidden && (
        <p role="note" className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
          {ANSWERS_HIDDEN_NOTICE}
        </p>
      )}
      <ol className={cn("space-y-3", className)}>
        {answers.map((answer, index) => {
          const isSkipped = answer.selected_answer_ids.length === 0;
          const isCorrect = !answersHidden && answer.is_correct === true;

          return (
            <li
              key={answer.question_id}
              className="rounded-2xl border border-border bg-card p-4 space-y-2"
            >
              <div className="flex items-start gap-2">
                {isSkipped || answersHidden ? (
                  <MinusCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : isCorrect ? (
                  <CheckCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
                )}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground">Câu {index + 1}. </span>
                    {answer.question_text}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isSkipped
                      ? "Chưa trả lời."
                      : answersHidden
                        ? `${answer.points_earned} điểm.`
                        : isCorrect
                          ? `Đúng — ${answer.points_earned} điểm.`
                          : `Chưa đúng — ${answer.points_earned} điểm.`}
                  </p>
                </div>
              </div>

              <dl className="space-y-1 pl-6 text-sm">
                <div className="flex gap-2">
                  <dt className="shrink-0 text-muted-foreground">Bạn chọn:</dt>
                  <dd className="font-medium">
                    {answer.selected_answer_ids.length > 0
                      ? answer.selected_answer_ids.map((id) => labelFor(id, answerText)).join(", ")
                      : "—"}
                  </dd>
                </div>
                {!answersHidden &&
                  answer.correct_answer_ids &&
                  answer.correct_answer_ids.length > 0 && (
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-muted-foreground">Đáp án đúng:</dt>
                      <dd className="font-medium text-emerald-700">
                        {answer.correct_answer_ids.map((id) => labelFor(id, answerText)).join(", ")}
                      </dd>
                    </div>
                  )}
              </dl>

              {!answersHidden && answer.explanation && (
                <div className="ml-6 flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <p>{answer.explanation}</p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
