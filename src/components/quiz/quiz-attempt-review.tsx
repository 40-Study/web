"use client";

/**
 * Xem lại bài đã nộp (contract §6) — mỗi câu kèm giải thích đáp án.
 *
 * Backend CHỈ trả `explanation` sau khi nộp (`GET /quizzes/:id/attempts/:attemptId`),
 * nên component này là màn duy nhất được phép hiển thị giải thích. Trước khi nộp
 * không có dữ liệu này và cũng không được bịa ra.
 *
 * Response kết quả không kèm chữ của đáp án, chỉ có id. Nếu màn gọi có sẵn bảng
 * id → chữ (lấy từ `/quizzes/:id/questions`) thì hiện chữ; thiếu thì hiện id rút
 * gọn — thà thấy id còn hơn thấy khoảng trắng không giải thích được.
 */

import { CheckCircle, XCircle, MinusCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuizReviewAnswer {
  question_id: string;
  question_text: string;
  selected_answer_ids: string[];
  correct_answer_ids?: string[];
  is_correct?: boolean;
  points_earned: number;
  explanation?: string;
}

interface QuizAttemptReviewProps {
  answers: QuizReviewAnswer[];
  /** id đáp án → chữ của đáp án; thiếu thì hiển thị id rút gọn. */
  answerText?: Map<string, string>;
  className?: string;
}

/** Không có chữ thì hiện id rút gọn — 8 ký tự đầu là đủ để đối chiếu. */
function labelFor(id: string, answerText?: Map<string, string>): string {
  return answerText?.get(id) ?? `Đáp án ${id.slice(0, 8)}`;
}

export function QuizAttemptReview({ answers, answerText, className }: QuizAttemptReviewProps) {
  if (answers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Chưa có dữ liệu chi tiết cho lần làm này.</p>
    );
  }

  return (
    <ol className={cn("space-y-3", className)}>
      {answers.map((answer, index) => {
        const isSkipped = answer.selected_answer_ids.length === 0;
        const isCorrect = answer.is_correct === true;

        return (
          <li
            key={answer.question_id}
            className="rounded-2xl border border-border bg-card p-4 space-y-2"
          >
            <div className="flex items-start gap-2">
              {isSkipped ? (
                <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              ) : isCorrect ? (
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
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
                    ? "Bạn bỏ trống câu này."
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
                    ? answer.selected_answer_ids
                        .map((id) => labelFor(id, answerText))
                        .join(", ")
                    : "—"}
                </dd>
              </div>
              {answer.correct_answer_ids && answer.correct_answer_ids.length > 0 && (
                <div className="flex gap-2">
                  <dt className="shrink-0 text-muted-foreground">Đáp án đúng:</dt>
                  <dd className="font-medium text-emerald-700">
                    {answer.correct_answer_ids.map((id) => labelFor(id, answerText)).join(", ")}
                  </dd>
                </div>
              )}
            </dl>

            {answer.explanation && (
              <div className="ml-6 flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <p>{answer.explanation}</p>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
