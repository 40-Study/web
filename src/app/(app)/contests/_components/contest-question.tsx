"use client";

/**
 * Một câu hỏi trong bài thi. Chỉ đọc `AttemptQuestionDTO` (không có đáp án đúng) và cố ý CHỈ
 * render các field đã khai báo — kể cả khi backend lỡ trả thêm field đáp án, màn hình cũng không
 * hiện (có test kiểm).
 */
import { cn } from "@/lib/utils";
import { formatContestScore } from "@/lib/contest/contest-format";
import { toggleAnswer, type ContestAnswerDraft } from "@/lib/contest/contest-answers";
import type { ContestAttemptQuestion } from "@/types/contest";

const TYPE_HINT: Record<ContestAttemptQuestion["question_type"], string> = {
  single_choice: "Chọn một đáp án",
  multiple_choice: "Chọn tất cả đáp án đúng",
  true_false: "Đúng hay sai",
  fill_blank: "Điền câu trả lời",
};

interface ContestQuestionProps {
  index: number;
  question: ContestAttemptQuestion;
  draft: ContestAnswerDraft | undefined;
  disabled?: boolean;
  onChange: (draft: ContestAnswerDraft) => void;
}

export function ContestQuestion({ index, question, draft, disabled, onChange }: ContestQuestionProps) {
  const isMulti = question.question_type === "multiple_choice";
  const options = [...question.answers].sort((a, b) => a.display_order - b.display_order);
  const inputName = `q-${question.id}`;

  return (
    <fieldset className="min-w-0 space-y-3 rounded-2xl border border-gray-200 bg-white p-4" disabled={disabled}>
      <legend className="sr-only">Câu {index + 1}</legend>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-primary-700">
          Câu {index + 1} <span className="font-normal text-gray-500">· {TYPE_HINT[question.question_type]}</span>
        </p>
        <span className="text-xs text-gray-500">{formatContestScore(question.points)} điểm</span>
      </div>
      <p className="whitespace-pre-line break-words text-gray-900">{question.question_text}</p>
      {question.image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh câu hỏi từ MinIO/URL tuỳ ý
        <img src={question.image_url} alt={`Hình minh hoạ câu ${index + 1}`} className="max-h-72 max-w-full rounded-lg" />
      )}

      {question.question_type === "fill_blank" ? (
        <label className="block">
          <span className="sr-only">Câu trả lời câu {index + 1}</span>
          <input
            type="text"
            value={draft?.text ?? ""}
            onChange={(e) => onChange({ selected: [], text: e.target.value })}
            maxLength={500}
            placeholder="Nhập câu trả lời…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </label>
      ) : (
        <div className="space-y-2">
          {options.map((opt) => {
            const checked = draft?.selected.includes(opt.id) ?? false;
            return (
              <label
                key={opt.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                  checked ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:bg-gray-50"
                )}
              >
                <input
                  type={isMulti ? "checkbox" : "radio"}
                  name={inputName}
                  checked={checked}
                  onChange={() => onChange(toggleAnswer(question, draft, opt.id))}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary-600"
                />
                <span className="min-w-0 break-words text-gray-800">{opt.answer_text}</span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
