"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuizQuestions, useUpdateQuizQuestion } from "@/hooks/queries/use-quiz";
import { getErrorMessage } from "@/lib/error-messages";
import {
  buildUpdateQuestionBody,
  isChoiceQuestion,
  isDraftChanged,
  questionToDraft,
  validateQuestionDraft,
  type QuestionEditDraft,
} from "@/lib/quiz-question-edit";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/services/quiz.service";

function QuestionRow({ quizId, question, index }: { quizId: string; question: QuizQuestion; index: number }) {
  const original = questionToDraft(question);
  const [draft, setDraft] = useState<QuestionEditDraft>(original);
  const update = useUpdateQuizQuestion(quizId);
  const choice = isChoiceQuestion(question.question_type);
  const multiple = question.question_type === "multiple_choice";
  const error = validateQuestionDraft(question.question_type, draft);
  const changed = isDraftChanged(original, draft);
  const n = index + 1;

  const setCorrect = (i: number) =>
    setDraft((d) => ({
      ...d,
      answers: d.answers.map((a, j) => (multiple ? (j === i ? { ...a, isCorrect: !a.isCorrect } : a) : { ...a, isCorrect: j === i })),
    }));

  const save = () => {
    if (error || !changed) return;
    update.mutate(
      { questionId: question.id, data: buildUpdateQuestionBody(question.question_type, draft) },
      {
        onSuccess: () => toast.success(`Đã lưu câu hỏi ${n}`),
        onError: (err) => toast.error(getErrorMessage(err, `Không thể lưu câu hỏi ${n}`)),
      },
    );
  };

  return (
    <div data-testid={`quiz-edit-question-${index}`} className="space-y-2 rounded-lg border p-3">
      <p className="text-sm font-medium">Câu hỏi {n}</p>
      <Textarea
        aria-label={`Nội dung câu hỏi ${n}`}
        rows={2}
        value={draft.text}
        onChange={(e) => setDraft({ ...draft, text: e.target.value })}
      />
      {choice ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {multiple ? "Chọn các đáp án đúng." : "Bấm vào ký hiệu bên trái để chọn đáp án đúng."}
          </p>
          {draft.answers.map((a, j) => (
            <div key={j} className={cn("flex items-center gap-2 rounded-lg border p-2", a.isCorrect && "border-primary bg-primary/5")}>
              <input
                type={multiple ? "checkbox" : "radio"}
                name={`correct-${question.id}`}
                checked={a.isCorrect}
                onChange={() => setCorrect(j)}
                aria-label={`Chọn phương án ${String.fromCharCode(65 + j)} làm đáp án đúng của câu ${n}`}
              />
              <Input
                aria-label={`Phương án ${String.fromCharCode(65 + j)} câu ${n}`}
                value={a.text}
                // Câu Đúng/Sai: nhãn cố định, chỉ đổi đáp án đúng.
                disabled={question.question_type === "true_false"}
                onChange={(e) =>
                  setDraft({ ...draft, answers: draft.answers.map((x, k) => (k === j ? { ...x, text: e.target.value } : x)) })
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Đáp án của loại câu hỏi này chưa sửa được tại đây; chỉ sửa được nội dung và giải thích.</p>
      )}
      <Textarea
        aria-label={`Giải thích câu ${n}`}
        placeholder="Giải thích (hiển thị sau khi nộp bài)"
        rows={2}
        value={draft.explanation}
        onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
      />
      {changed && error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="button" size="sm" variant="outline" onClick={save} disabled={!changed || !!error || update.isPending}>
          {update.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Lưu câu {n}
        </Button>
      </div>
    </div>
  );
}

/**
 * Câu hỏi của quiz ĐÃ TẠO (Q3-16): sửa nội dung, đáp án và giải thích; mỗi câu lưu riêng. Thêm/xoá/sắp xếp lại
 * câu hỏi chưa có ở đây.
 */
export function QuizQuestionsEditor({ quizId }: { quizId: string }) {
  const { data, isLoading, isError } = useQuizQuestions(quizId);
  const questions = Array.isArray(data) ? [...data].sort((a, b) => a.display_order - b.display_order) : [];

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải câu hỏi...
      </p>
    );
  }
  if (isError) {
    return (
      <p role="alert" className="text-sm text-red-600">
        Không tải được danh sách câu hỏi của bài trắc nghiệm.
      </p>
    );
  }
  if (questions.length === 0) return null;

  return (
    <section aria-label="Câu hỏi của bài trắc nghiệm" className="space-y-3">
      <h3 className="text-sm font-semibold">Câu hỏi ({questions.length})</h3>
      <p className="text-xs text-muted-foreground">
        Mỗi câu lưu riêng bằng nút &ldquo;Lưu câu&rdquo;. Thêm, xoá hoặc sắp xếp lại câu hỏi chưa hỗ trợ ở đây.
      </p>
      {questions.map((q, i) => (
        <QuestionRow key={q.id} quizId={quizId} question={q} index={i} />
      ))}
    </section>
  );
}
