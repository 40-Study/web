"use client";
import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { gradeQuiz, type TeachingQuestion } from "@/lib/open-design/project";
export function QuizPreview({
  title,
  questions,
}: {
  title: string;
  questions: TeachingQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (Object.keys(answers).length !== questions.length) {
          setError("Hãy trả lời đủ các câu hỏi trước khi nộp.");
          return;
        }
        setError("");
        setSubmitted(true);
      }}
    >
      <div className="rounded-card border bg-card p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
          Preview · làm thử trắc nghiệm
        </p>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {questions.length} câu hỏi · mỗi câu có một đáp án đúng
        </p>
        {submitted && (
          <p role="status" className="mt-4 rounded-lg bg-primary/10 p-4 font-semibold text-primary">
            Kết quả: {gradeQuiz(questions, answers)}/{questions.length} câu đúng (
            {Math.round((gradeQuiz(questions, answers) / questions.length) * 100)}%)
          </p>
        )}
      </div>
      {questions.map((q, i) => (
        <fieldset key={i} className="rounded-card border bg-card p-5">
          <legend className="sr-only">Câu {i + 1}</legend>
          <p className="mb-4 font-semibold">
            {i + 1}. {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((option, j) => (
              <label
                key={j}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm",
                  submitted && j === q.correct_answer
                    ? "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100"
                    : submitted && answers[i] === j
                      ? "border-red-400 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100"
                      : answers[i] === j
                        ? "border-primary bg-primary/5"
                        : "border-border"
                )}
              >
                <input
                  type="radio"
                  name={`preview-question-${i}`}
                  aria-label={`Câu ${i + 1}, ${String.fromCharCode(65 + j)}: ${option}`}
                  checked={answers[i] === j}
                  disabled={submitted}
                  onChange={() => setAnswers({ ...answers, [i]: j })}
                  className="mt-1 accent-primary-600"
                />
                <span className="flex-1">
                  {String.fromCharCode(65 + j)}. {option}
                </span>
                {submitted && j === q.correct_answer && <Check className="h-4 w-4" />}
              </label>
            ))}
          </div>
          {submitted && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              <strong>Giải thích:</strong> {q.explanation}
            </p>
          )}
        </fieldset>
      ))}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        {submitted ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
              setError("");
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Làm lại
          </Button>
        ) : (
          <Button type="submit">Nộp bài thử</Button>
        )}
        <p className="self-center text-xs text-muted-foreground">
          Kết quả làm thử chỉ ở trình duyệt.
        </p>
      </div>
    </form>
  );
}
