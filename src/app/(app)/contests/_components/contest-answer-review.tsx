"use client";

/**
 * Xem lại bài thi sau khi đáp án được công bố (my-result, ĐÍNH CHÍNH 2 và 3).
 *
 * Chữ của đáp án lấy từ CHÍNH response: `options` (câu chọn) và `accepted_answers` (câu điền
 * khuyết), theo ĐÍNH CHÍNH 3. Trước đây web tự nhớ chữ ở localStorage lúc làm bài, nên xem trên
 * máy khác, sau khi xoá dữ liệu site, và LUÔN LUÔN với câu điền khuyết đều hiện id thay chữ
 * (review M1).
 *
 * Không dùng lại `QuizAttemptReview` (components/quiz) vì component đó bỏ qua `text_answer`, nên
 * câu điền khuyết đã điền bị hiện "bỏ trống".
 */
import { CheckCircle, Lightbulb, MinusCircle, XCircle } from "lucide-react";
import { formatContestScore } from "@/lib/contest/contest-format";
import { cn } from "@/lib/utils";
import type { ContestReviewAnswer } from "@/types/contest";

/** Lựa chọn không có trong `options` (dữ liệu lệch): nói thật thay vì in id. */
const MISSING_OPTION = "(lựa chọn không còn tồn tại)";

function optionText(a: ContestReviewAnswer, id: string): string {
  return a.options.find((o) => o.id === id)?.answer_text ?? MISSING_OPTION;
}

/** Câu trả lời của thí sinh dạng chữ; `null` = bỏ trống. */
export function contestAnswerGiven(a: ContestReviewAnswer): string | null {
  const text = a.text_answer?.trim();
  if (text) return text;
  const ids = a.selected_answer_ids ?? [];
  return ids.length > 0 ? ids.map((id) => optionText(a, id)).join(", ") : null;
}

/** Đáp án đúng dạng chữ; điền khuyết có thể chấp nhận nhiều cách viết. */
export function contestCorrectAnswer(a: ContestReviewAnswer): string {
  if (a.question_type === "fill_blank") return a.accepted_answers.join(" / ");
  return (a.correct_answer_ids ?? []).map((id) => optionText(a, id)).join(", ");
}

export function ContestAnswerReview({ answers }: { answers: ContestReviewAnswer[] }) {
  if (answers.length === 0) return <p className="text-sm text-gray-600">Chưa có dữ liệu chi tiết cho bài làm này.</p>;

  return (
    <ol className="space-y-3">
      {answers.map((a, i) => {
        const given = contestAnswerGiven(a);
        const Icon = given === null ? MinusCircle : a.is_correct ? CheckCircle : XCircle;
        const tone = given === null ? "text-gray-400" : a.is_correct ? "text-emerald-600" : "text-red-500";
        const correct = contestCorrectAnswer(a);
        return (
          <li key={a.id} className="min-w-0 space-y-1.5 rounded-xl border border-gray-200 p-3 text-sm">
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
