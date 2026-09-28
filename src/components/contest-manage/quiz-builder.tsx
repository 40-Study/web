"use client";

/**
 * Tạo nhanh bài trắc nghiệm standalone cho cuộc thi.
 *
 * Tạo quiz trước rồi lần lượt từng câu. Nếu một câu lỗi giữa chừng, component NHỚ quiz đã tạo và số
 * câu đã lưu: bấm "Lưu" lần nữa chỉ thêm các câu còn thiếu vào CHÍNH quiz đó (không tạo quiz trùng),
 * còn các câu đã lưu bị khoá sửa để nội dung trên màn hình luôn khớp với backend. Bấm "Huỷ" khi đã có
 * quiz dở thì xoá quiz đó (chưa ai làm nên backend cho xoá) để không để lại rác.
 */

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { contestErrorMessage } from "@/lib/contest-manage/errors";
import {
  FILL_BLANK_MAX_ACCEPTED,
  QUESTION_TYPE_LABEL,
  newQuestion,
  toCreateQuestionDTO,
  validateQuizDraft,
  type ContestQuestionType,
  type QuestionDraft,
} from "@/lib/contest-manage/quiz-draft";
import { quizService } from "@/services/quiz.service";

const FIELD =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900";

interface QuizBuilderProps {
  onCreated: (quizId: string) => void;
  onCancel: () => void;
}

/** Quiz đã tạo trên backend và số câu đầu tiên đã lưu thành công. */
interface PartialQuiz {
  quizId: string;
  saved: number;
}

export function QuizBuilder({ onCreated, onCancel }: QuizBuilderProps) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [partial, setPartial] = useState<PartialQuiz | null>(null);

  const savedCount = partial?.saved ?? 0;
  const isLocked = (qi: number) => qi < savedCount;

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
    let quizId = partial?.quizId ?? null;
    let saved = partial?.saved ?? 0;
    try {
      if (!quizId) {
        const quiz = await quizService.create({ title: title.trim(), trigger_type: "manual" });
        quizId = quiz.id;
      }
      for (let i = saved; i < questions.length; i += 1) {
        try {
          await quizService.createQuestion(quizId, toCreateQuestionDTO(questions[i], i));
          saved = i + 1;
        } catch (err) {
          setError(
            `Lưu câu ${i + 1} thất bại: ${contestErrorMessage(err, "lỗi không xác định")}. Sửa rồi bấm lưu lại, các câu đã lưu được giữ nguyên.`
          );
          return;
        }
      }
      setPartial(null);
      onCreated(quizId);
    } catch (err) {
      setError(contestErrorMessage(err, "Không thể tạo bài trắc nghiệm, thử lại sau."));
    } finally {
      // Ghi lại tiến độ kể cả khi lỗi, để lần lưu sau tái dùng đúng quiz và bỏ qua câu đã lưu.
      if (quizId && saved < questions.length) setPartial({ quizId, saved });
      setSaving(false);
    }
  };

  const cancel = async () => {
    if (partial) {
      try {
        await quizService.delete(partial.quizId);
      } catch (err) {
        toast.error(contestErrorMessage(err, "Không xoá được bài trắc nghiệm đang tạo dở."));
      }
    }
    onCancel();
  };

  return (
    <div className="space-y-4 rounded-xl border border-primary-200 bg-primary-50/40 p-4 dark:border-primary-900 dark:bg-primary-950/20" data-testid="quiz-builder">
      <div>
        <label htmlFor="quiz-title" className="mb-1 block text-sm font-medium">
          Tên bài trắc nghiệm <span className="text-red-500">*</span>
        </label>
        <input
          id="quiz-title"
          value={title}
          disabled={!!partial}
          onChange={(e) => setTitle(e.target.value)}
          className={FIELD}
        />
      </div>

      {questions.map((q, qi) => {
        const locked = isLocked(qi);
        const fillBlank = q.type === "fill_blank";
        return (
          <div key={qi} className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950" data-testid={`question-${qi}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                Câu {qi + 1}
                {locked && <span className="ml-2 text-xs font-normal text-green-700">Đã lưu</span>}
              </span>
              <Button
                type="button"
                variant="destructiveGhost"
                size="icon"
                disabled={questions.length === 1 || locked}
                onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}
                aria-label={`Xoá câu ${qi + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <textarea
              value={q.text}
              disabled={locked}
              onChange={(e) => updateQuestion(qi, { text: e.target.value })}
              rows={2}
              placeholder={fillBlank ? "Nội dung câu hỏi, ví dụ: Thủ đô của Việt Nam là ___" : "Nội dung câu hỏi"}
              aria-label={`Nội dung câu ${qi + 1}`}
              className={FIELD}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={q.type}
                disabled={locked}
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
                disabled={locked}
                aria-label={`Điểm câu ${qi + 1}`}
                onChange={(e) => updateQuestion(qi, { points: e.target.value })}
                className={FIELD}
              />
            </div>
            {fillBlank && (
              <p className="text-xs text-gray-500" data-testid={`fill-blank-hint-${qi}`}>
                Học viên gõ câu trả lời; bài được tính đúng khi khớp một trong các đáp án dưới đây. Hệ thống bỏ
                khoảng trắng thừa và không phân biệt chữ hoa, chữ thường, nhưng GIỮ NGUYÊN dấu (&quot;Ha Noi&quot; khác
                &quot;Hà Nội&quot;). Thêm các cách viết khác nếu muốn chấp nhận.
              </p>
            )}
            <div className="space-y-2">
              {q.answers.map((a, ai) => (
                <div key={ai} className="flex items-center gap-2">
                  {!fillBlank && (
                    <input
                      type={q.type === "multiple_choice" ? "checkbox" : "radio"}
                      name={`correct-${qi}`}
                      checked={a.correct}
                      disabled={locked}
                      onChange={(e) => setCorrect(qi, ai, e.target.checked)}
                      aria-label={`Câu ${qi + 1} đáp án ${ai + 1} đúng`}
                    />
                  )}
                  <input
                    value={a.text}
                    disabled={locked || q.type === "true_false"}
                    onChange={(e) =>
                      updateQuestion(qi, {
                        answers: q.answers.map((x, i) => (i === ai ? { ...x, text: e.target.value } : x)),
                      })
                    }
                    placeholder={fillBlank ? `Đáp án chấp nhận ${ai + 1}` : `Đáp án ${ai + 1}`}
                    aria-label={fillBlank ? `Câu ${qi + 1} đáp án chấp nhận ${ai + 1}` : `Câu ${qi + 1} đáp án ${ai + 1}`}
                    className={FIELD}
                  />
                  {!locked && q.type !== "true_false" && q.answers.length > (fillBlank ? 1 : 2) && (
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
              {!locked && q.type !== "true_false" && q.answers.length < (fillBlank ? FILL_BLANK_MAX_ACCEPTED : 6) && (
                <button
                  type="button"
                  className="text-xs font-medium text-primary-700"
                  onClick={() =>
                    updateQuestion(qi, { answers: [...q.answers, { text: "", correct: fillBlank }] })
                  }
                >
                  {fillBlank ? "+ Thêm cách viết khác" : "+ Thêm đáp án"}
                </button>
              )}
            </div>
          </div>
        );
      })}

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
        <Button type="button" variant="outline" onClick={cancel} disabled={saving}>
          Huỷ
        </Button>
        <Button type="button" onClick={save} isLoading={saving} data-testid="quiz-builder-save">
          {partial ? "Lưu các câu còn lại" : "Lưu bài trắc nghiệm"}
        </Button>
      </div>
    </div>
  );
}
