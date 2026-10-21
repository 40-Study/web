"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Eye, Pencil, Plus, Sparkles, Trash2, X, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QuizPreview } from "@/components/open-design/quiz-preview";
import { openDesignService } from "@/services/open-design.service";
import { BUILTIN_SKILLS } from "@/lib/open-design/skills";
import { cn } from "@/lib/utils";

export interface LessonQuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctId: string;
  explanation?: string;
}
export const newLessonQuestion = (): LessonQuizQuestion => ({
  id: crypto.randomUUID(),
  question: "",
  correctId: "",
  explanation: "",
  options: Array.from({ length: 4 }, () => ({ id: crypto.randomUUID(), text: "" })),
});

export function lessonQuestionError(q: LessonQuizQuestion) {
  if (!q.correctId || !q.options.some((o) => o.id === q.correctId))
    return "Chọn đáp án đúng cho câu hỏi này.";
  if (!q.question.trim()) return "Nhập nội dung câu hỏi.";
  const texts = q.options.map((o) => o.text.trim().toLocaleLowerCase());
  if (texts.length < 2 || texts.some((t) => !t)) return "Điền đầy đủ các phương án trả lời.";
  if (new Set(texts).size !== texts.length) return "Các phương án trả lời không được trùng nhau.";
  return "";
}

export function LessonQuizBuilder({
  title,
  questions,
  onChange,
  errors,
}: {
  title: string;
  questions: LessonQuizQuestion[];
  onChange: (value: LessonQuizQuestion[]) => void;
  errors: Record<string, string>;
}) {
  const [preview, setPreview] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(5);
  const [source, setSource] = useState<{ name: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [candidate, setCandidate] = useState<LessonQuizQuestion[] | null>(null);
  const active = useRef<{ controller: AbortController; requestID?: string } | null>(null);
  const cancelling = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => {
      active.current?.controller.abort();
      if (active.current?.requestID)
        void openDesignService.cancel(active.current.requestID).catch(() => {});
    },
    []
  );
  const valid = questions.length > 0 && questions.every((q) => !lessonQuestionError(q));
  const update = (id: string, values: Partial<LessonQuizQuestion>) =>
    onChange(questions.map((q) => (q.id === id ? { ...q, ...values } : q)));
  async function upload(file: File) {
    if (active.current) return;
    const task = { controller: new AbortController() };
    active.current = task;
    setBusy(true);
    setError("");
    try {
      setSource(await openDesignService.document(file, task.controller.signal));
    } catch (e) {
      if (!task.controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Không đọc được tài liệu.");
    } finally {
      if (active.current === task && !cancelling.current) {
        active.current = null;
        setBusy(false);
      }
    }
  }
  async function generate() {
    if (active.current || !prompt.trim()) return;
    const task = { controller: new AbortController(), requestID: crypto.randomUUID() };
    active.current = task;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await openDesignService.generate(
        {
          request_id: task.requestID,
          output: "quiz",
          count,
          prompt: `Bài học: ${title}. ${prompt}`,
          documents: source ? [source] : [],
          skills: [BUILTIN_SKILLS[1]],
        },
        task.controller.signal
      );
      if (task.controller.signal.aborted || result.artifact.kind !== "quiz") return;
      const generated = result.artifact.questions.map((q) => {
        const options = q.options.map((text) => ({ id: crypto.randomUUID(), text }));
        return {
          id: crypto.randomUUID(),
          question: q.question,
          options,
          correctId: options[q.correct_answer].id,
          explanation: q.explanation,
        };
      });
      // Keep the teacher's draft until they explicitly apply the generated questions.
      setCandidate(generated);
    } catch (e) {
      if (!task.controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Không tạo được câu hỏi.");
    } finally {
      if (active.current === task && !cancelling.current) {
        active.current = null;
        setBusy(false);
      }
    }
  }
  async function cancel() {
    const task = active.current;
    if (!task) return;
    cancelling.current = true;
    task.controller.abort();
    if (task.requestID) await openDesignService.cancel(task.requestID).catch(() => {});
    cancelling.current = false;
    if (active.current === task) {
      active.current = null;
      setBusy(false);
      setNotice("Đã dừng. Câu hỏi đang soạn vẫn được giữ.");
    }
  }
  return (
    <section className="space-y-4" aria-label="Soạn trắc nghiệm bài học">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/30 p-3">
        <div>
          <p className="text-sm font-semibold">Câu hỏi trắc nghiệm</p>
          <p className="text-xs text-muted-foreground">
            {questions.length} câu · Mỗi câu một đáp án đúng
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setAiOpen(!aiOpen)}
            disabled={busy}
          >
            <Sparkles className="mr-1 h-4 w-4" />
            Tạo bằng AI
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!preview && !valid}
            onClick={() => setPreview(!preview)}
          >
            {preview ? <Pencil className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
            {preview ? "Soạn câu hỏi" : "Làm thử"}
          </Button>
        </div>
      </div>
      {aiOpen && (
        <div className="space-y-3 rounded-xl border p-4">
          <Textarea
            aria-label="Yêu cầu tạo trắc nghiệm"
            placeholder="Ví dụ: Tạo câu hỏi vận dụng về vòng lặp cho lớp 10, có lời giải."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={busy}
            rows={3}
          />
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.pptx,.txt,.md"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="mr-1 h-4 w-4" />
              Tài liệu
            </Button>
            {source && (
              <span className="flex items-center gap-1 text-xs">
                {source.name}
                <button
                  type="button"
                  aria-label="Gỡ tài liệu tạo trắc nghiệm"
                  disabled={busy}
                  onClick={() => setSource(null)}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <label className="ml-auto flex items-center gap-2 text-sm">
              Số câu
              <input
                aria-label="Số câu AI"
                type="number"
                className="w-14 rounded border bg-background p-1"
                min={1}
                max={30}
                value={count}
                disabled={busy}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </label>
            {busy ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  if (e.detail <= 1) void cancel();
                }}
              >
                Dừng tạo
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={!prompt.trim() || count < 1 || count > 30 || !Number.isInteger(count)}
                onClick={() => void generate()}
              >
                Tạo câu hỏi
              </Button>
            )}
          </div>
          {busy && (
            <p role="status" className="text-sm text-muted-foreground">
              Đang xử lý tài liệu và câu hỏi…
            </p>
          )}
          {candidate && (
            <div className="space-y-2 rounded-lg bg-muted p-3">
              <p className="text-sm">Đã tạo {candidate.length} câu. Chọn cách đưa vào bài học:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onChange([...questions.filter((q) => q.question.trim()), ...candidate]);
                    setCandidate(null);
                    setPreview(false);
                    setNotice("Đã thêm câu hỏi. Kiểm tra đáp án trước khi lưu bài học.");
                  }}
                >
                  Thêm vào cuối
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onChange(candidate);
                    setCandidate(null);
                    setPreview(false);
                    setNotice("Đã thay bằng câu hỏi AI. Bài học chỉ thay đổi khi bấm Lưu.");
                  }}
                >
                  Thay toàn bộ câu hỏi
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setCandidate(null)}>
                  Bỏ kết quả AI
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      {preview && valid ? (
        <QuizPreview
          title={title || "Trắc nghiệm bài học"}
          questions={questions.map((q) => ({
            question: q.question,
            options: q.options.map((o) => o.text) as [string, string, string, string],
            correct_answer: q.options.findIndex((o) => o.id === q.correctId),
            explanation: q.explanation || "",
          }))}
        />
      ) : (
        <>
          {questions.map((q, i) => (
            <div
              key={q.id}
              data-testid={`quiz-question-${i}`}
              className={cn(
                "space-y-3 rounded-xl border p-4",
                errors[q.id] && "border-destructive"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Câu hỏi {i + 1}</span>
                {questions.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Xoá câu hỏi ${i + 1}`}
                    onClick={() => onChange(questions.filter((item) => item.id !== q.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Textarea
                aria-label={`Nội dung câu hỏi ${i + 1}`}
                placeholder="Nhập câu hỏi..."
                rows={2}
                value={q.question}
                onChange={(e) => update(q.id, { question: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Bấm vào chữ cái để chọn đáp án đúng.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((o, j) => (
                  <div
                    key={o.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2",
                      q.correctId === o.id && "border-primary bg-primary/5"
                    )}
                  >
                    <button
                      type="button"
                      aria-label={`Chọn phương án ${String.fromCharCode(65 + j)} làm đáp án đúng của câu ${i + 1}`}
                      aria-pressed={q.correctId === o.id}
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm",
                        q.correctId === o.id && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => update(q.id, { correctId: o.id })}
                    >
                      {q.correctId === o.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        String.fromCharCode(65 + j)
                      )}
                    </button>
                    <Input
                      aria-label={`Phương án ${String.fromCharCode(65 + j)} câu ${i + 1}`}
                      placeholder="Phương án..."
                      value={o.text}
                      onChange={(e) =>
                        update(q.id, {
                          options: q.options.map((opt) =>
                            opt.id === o.id ? { ...opt, text: e.target.value } : opt
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <Textarea
                label={`Giải thích câu ${i + 1}`}
                placeholder="Giải thích vì sao đáp án này đúng (hiển thị sau khi nộp bài)"
                rows={2}
                value={q.explanation || ""}
                onChange={(e) => update(q.id, { explanation: e.target.value })}
              />
              {errors[q.id] && (
                <p role="alert" className="text-xs text-destructive">
                  {errors[q.id]}
                </p>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => onChange([...questions, newLessonQuestion()])}
          >
            <Plus className="mr-1 h-4 w-4" />
            Thêm câu hỏi
          </Button>
        </>
      )}
    </section>
  );
}
