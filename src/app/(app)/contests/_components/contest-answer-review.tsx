"use client";

/**
 * Xem lại bài thi sau khi cuộc thi đóng (my-result, §4.3). Không dùng lại `QuizAttemptReview`
 * (components/quiz) vì component đó chỉ đọc `selected_answer_ids`: câu điền khuyết (`fill_blank`,
 * đáp án nằm ở `text_answer`) bị hiện "Bạn bỏ trống câu này" dù thí sinh đã điền và được điểm
 * (phát hiện khi kiểm sống 28/09).
 */
import { CheckCircle, Lightbulb, MinusCircle, XCircle } from "lucide-react";
import { formatContestScore } from "@/lib/contest/contest-format";
import { cn } from "@/lib/utils";
import type { ContestReviewAnswer } from "@/types/contest";

/** Chữ của đáp án theo id; thiếu (máy khác, đã xoá nháp) thì hiện id rút gọn. */
function labelFor(id: string, answerText?: Map<string, string>): string {
  return answerText?.get(id) ?? `Đáp án ${id.slice(0, 8)}`;
}

export function contestAnswerGiven(a: ContestReviewAnswer, answerText?: Map<string, string>): string | null {
  const text = a.text_answer?.trim();
  if (text) return text;
  const ids = a.selected_answer_ids ?? [];
  return ids.length > 0 ? ids.map((id) => labelFor(id, answerText)).join(", ") : null;
}

export function ContestAnswerReview({ answers, answerText }: { answers: ContestReviewAnswer[]; answerText?: Map<string, string> }) {
  if (answers.length === 0) return <p className="text-sm text-gray-600">Chưa có dữ liệu chi tiết cho bài làm này.</p>;

  return (
    <ol className="space-y-3">
      {answers.map((a, i) => {
        const given = contestAnswerGiven(a, answerText);
        const Icon = given === null ? MinusCircle : a.is_correct ? CheckCircle : XCircle;
        const tone = given === null ? "text-gray-400" : a.is_correct ? "text-emerald-600" : "text-red-500";
        const correct = (a.correct_answer_ids ?? []).map((id) => labelFor(id, answerText)).join(", ");
        return (
          <li key={a.id} className="space-y-1.5 rounded-xl border border-gray-200 p-3 text-sm">
            <p className="flex items-start gap-2 font-medium text-gray-900">
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} aria-hidden="true" />
              <span className="min-w-0 break-words">
                Câu {i + 1}. {a.question_text}
              </span>
            </p>
            <p className="pl-6 text-xs text-gray-500">
              {given === null ? "Bạn bỏ trống câu này" : a.is_correct ? "Đúng" : "Sai"} · {formatContestScore(a.points_earned)} điểm
            </p>
            <p className="break-words pl-6">
              <span className="text-gray-500">Bạn trả lời: </span>
              {given ?? "—"}
            </p>
            {correct && (
              <p className="break-words pl-6">
                <span className="text-gray-500">Đáp án đúng: </span>
                <span className="font-medium text-emerald-700">{correct}</span>
              </p>
            )}
            {a.explanation && (
              <p className="ml-6 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-amber-900">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="break-words">{a.explanation}</span>
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
