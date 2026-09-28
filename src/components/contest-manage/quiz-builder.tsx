"use client";

/**
 * Tạo nhanh bài trắc nghiệm standalone cho cuộc thi. Tạo quiz trước rồi lần lượt từng câu; nếu một
 * câu lỗi thì dừng và báo đúng câu đó — quiz đã tạo vẫn còn (sửa tiếp được vì cuộc thi chưa gửi duyệt).
 */

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { contestErrorMessage } from "@/lib/contest-manage/errors";
import {
  QUESTION_TYPE_LABEL,
  newQuestion,
  toCreateQuestionDTO,
  validateQuizDraft,
  type ContestQuestionType,
  type QuestionDraft,
} from "@/lib/contest-manage/quiz-draft";
import { quizService } from "@/services/quiz.service";

const FIELD =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900";

interface QuizBuilderProps {
  onCreated: (quizId: string) => void;
  onCancel: () => void;
}

export function QuizBuilder({ onCreated, onCancel }: QuizBuilderProps) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateQuestion = (qi: number, patch: Partial<QuestionDraft>) =>
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  const setCorrect = (qi: number, ai: number, checked: boolean) => {
    const q = questions[qi];
    const answers = q.answers.map((a, i) => {
      if (q.type === "multiple_choice") return i === ai ? { ...a, correct: checked } : a;
      return { ...a, correct: i === ai };
    });
    updateQuestion(qi, { answers });
  };

  const save = async () => {
    const problem = validateQuizDraft(title, questions);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const quiz = await quizService.create({ title: title.trim(), trigger_type: "manual" });
      for (let i = 0; i < questions.length; i += 1) {
        try {
          await quizService.createQuestion(quiz.id, toCreateQuestionDTO(questions[i], i));
        } catch (err) {
          setError(
            `Đã tạo bài trắc nghiệm nhưng lưu câu ${i + 1} thất bại: ${contestErrorMessage(err, "lỗi không xác định")}`
          );
          return;
        }
      }
      onCreated(quiz.id);
    } catch (err) {
      setError(contestErrorMessage(err, "Không thể tạo bài trắc nghiệm, thử lại sau."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-primary-200 bg-primary-50/40 p-4 dark:border-primary-900 dark:bg-primary-950/20" data-testid="quiz-builder">
      <div>
        <label htmlFor="quiz-title" className="mb-1 block text-sm font-medium">
          Tên bài trắc nghiệm <span className="text-red-500">*</span>
        </label>
        <input id="quiz-title" value={title} onChange={(e) => setTitle(e.target.value)} className={FIELD} />
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950" data-testid={`question-${qi}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">Câu {qi + 1}</span>
            <Button
              type="button"
              variant="destructiveGhost"
              size="icon"
              disabled={questions.length === 1}
              onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}
              aria-label={`Xoá câu ${qi + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <textarea
            value={q.text}
            onChange={(e) => updateQuestion(qi, { text: e.target.value })}
            rows={2}
            placeholder="Nội dung câu hỏi"
            aria-label={`Nội dung câu ${qi + 1}`}
            className={FIELD}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={q.type}
              aria-label={`Loại câu ${qi + 1}`}
              onChange={(e) => {
                const type = e.target.value as ContestQuestionType;
                updateQuestion(qi, { ...newQuestion(type), text: q.text, points: q.points });
              }}
              className={FIELD}
            >
              {(Object.keys(QUESTION_TYPE_LABEL) as ContestQuestionType[]).map((t) => (
                <option key={t} value={t}>
                  {QUESTION_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={q.points}
              aria-label={`Điểm câu ${qi + 1}`}
              onChange={(e) => updateQuestion(qi, { points: e.target.value })}
              className={FIELD}
            />
          </div>
          <div className="space-y-2">
            {q.answers.map((a, ai) => (
              <div key={ai} className="flex items-center gap-2">
                <input
                  type={q.type === "multiple_choice" ? "checkbox" : "radio"}
                  name={`correct-${qi}`}
                  checked={a.correct}
                  onChange={(e) => setCorrect(qi, ai, e.target.checked)}
                  aria-label={`Câu ${qi + 1} đáp án ${ai + 1} đúng`}
                />
                <input
                  value={a.text}
                  disabled={q.type === "true_false"}
                  onChange={(e) =>
                    updateQuestion(qi, {
                      answers: q.answers.map((x, i) => (i === ai ? { ...x, text: e.target.value } : x)),
                    })
                  }
                  placeholder={`Đáp án ${ai + 1}`}
                  aria-label={`Câu ${qi + 1} đáp án ${ai + 1}`}
                  className={FIELD}
                />
                {q.type !== "true_false" && q.answers.length > 2 && (
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() => updateQuestion(qi, { answers: q.answers.filter((_, i) => i !== ai) })}
                  >
                    Xoá
                  </button>
                )}
              </div>
            ))}
            {q.type !== "true_false" && q.answers.length < 6 && (
              <button
                type="button"
                className="text-xs font-medium text-primary-700"
                onClick={() => updateQuestion(qi, { answers: [...q.answers, { text: "", correct: false }] })}
              >
                + Thêm đáp án
              </button>
            )}
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={() => setQuestions((p) => [...p, newQuestion()])}>
        <Plus className="mr-1 h-4 w-4" />
        Thêm câu hỏi
      </Button>

      {error && (
        <p role="alert" className="text-sm text-red-600" data-testid="quiz-builder-error">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Huỷ
        </Button>
        <Button type="button" onClick={save} isLoading={saving} data-testid="quiz-builder-save">
          Lưu bài trắc nghiệm
        </Button>
      </div>
    </div>
  );
}
