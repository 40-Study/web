"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Play, Send, CheckCircle2, Terminal, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonacoSourceEditor } from "@/components/code-workspace/monaco-source-editor";
import {
  CodeJudgeResult,
  CODE_VERDICT_LABELS,
} from "@/components/code-workspace/code-judge-result";
import {
  lessonCodeService,
  type LessonCodeDetail,
  type LessonCodeHistoryItem,
} from "@/services/lesson-code.service";
import type { ContestCodeResult } from "@/types/contest";
import type { LessonProgressResponse } from "@/services/enrollment.service";
import { useAuthStore } from "@/stores/auth.store";
import { getErrorMessage } from "@/lib/error-messages";
import { NonVideoLessonContent, useMarkLessonCompleted } from "./non-video-lesson-content";
import { LessonCodeHistory } from "./lesson-code-history";
import {
  readLessonCodeDraft,
  writeLessonCodeDraft,
  type LessonCodeDraft,
} from "./lesson-code-draft-storage";

const LANGUAGES = [
  { id: "python", label: "Python 3" },
  { id: "javascript", label: "JavaScript" },
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "java", label: "Java" },
  { id: "go", label: "Go" },
];
const normalize = (value: string) =>
  ({ python3: "python", "c++": "cpp", js: "javascript" })[value.toLowerCase()] ??
  value.toLowerCase();
export function LessonCodeWorkspace({
  lessonId,
  exerciseId,
  courseId,
  courseSlug,
  completed,
  onProgress,
}: {
  lessonId: string;
  exerciseId: string;
  courseId: string;
  courseSlug: string;
  completed: boolean;
  onProgress?: (progress: LessonProgressResponse) => void;
}) {
  const userID = useAuthStore((s) => s.user?.id ?? "");
  const qc = useQueryClient();
  const key = ["lesson-code", lessonId, exerciseId, userID];
  const detail = useQuery({
    queryKey: key,
    queryFn: () => lessonCodeService.get(lessonId, exerciseId),
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [consoleTab, setConsoleTab] = useState<"input" | "result">("input");
  const [language, setLanguage] = useState("");
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  // Lỗi của lần chạy/nộp gần nhất: bảng kết quả hiện lỗi này thay vì verdict cũ.
  const [judgeError, setJudgeError] = useState("");
  const [result, setResult] = useState<ContestCodeResult | null>(null);
  const active = useRef(false);
  const retry = useRef<{ fingerprint: string; id: string } | null>(null);
  const drafts = useRef<LessonCodeDraft>({ drafts: {} });
  const exercise = detail.data?.exercise;
  const isCodeExercise = !!exercise?.language?.length;
  const historyKey = ["lesson-code-history", exerciseId, userID];
  const history = useQuery({
    queryKey: historyKey,
    queryFn: () => lessonCodeService.history(exerciseId),
    enabled: isCodeExercise,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const languages = LANGUAGES.filter(
    (l) => !exercise?.language?.length || exercise.language.map(normalize).includes(l.id)
  );
  // Ngôn ngữ đã lưu nhưng bài tập không còn cho phép -> quay về ngôn ngữ đầu tiên.
  const selected = languages.some((l) => l.id === language)
    ? language
    : languages[0]?.id || "python";
  const storageKey = `fortex:lesson-code:${userID}:${lessonId}:${exerciseId}`;
  const mark = useMarkLessonCompleted({ lessonId, courseId, onProgress });
  useEffect(() => {
    drafts.current = readLessonCodeDraft(storageKey);
    setLanguage(drafts.current.language ?? "");
  }, [storageKey]);
  useEffect(() => {
    if (!exercise) return;
    const saved = drafts.current.drafts[selected];
    setCode(
      typeof saved === "string"
        ? saved
        : selected === normalize(exercise.language?.[0] ?? "python")
          ? (exercise.starter_code ?? "")
          : ""
    );
    setStdin(exercise.test_cases?.[0]?.input ?? "");
    setResult(null);
    setJudgeError("");
  }, [exercise, selected]);
  function persist(nextLanguage: string) {
    drafts.current.language = nextLanguage;
    try {
      writeLessonCodeDraft(storageKey, drafts.current);
    } catch {
      setError("Không lưu được nháp. Hãy sao chép mã trước khi rời trang.");
    }
  }
  function save(value: string) {
    setCode(value);
    drafts.current.drafts[selected] = value;
    persist(selected);
  }
  function chooseLanguage(next: string) {
    setLanguage(next);
    persist(next);
  }
  function openSubmission(item: LessonCodeHistoryItem) {
    const lang = normalize(item.language);
    if (!languages.some((l) => l.id === lang)) {
      setError("Bài tập không còn cho phép ngôn ngữ của bài nộp này.");
      return;
    }
    const draft = drafts.current.drafts[lang];
    if (
      draft?.trim() &&
      draft !== item.code &&
      !window.confirm("Thay mã đang viết bằng mã của bài nộp này?")
    )
      return;
    drafts.current.drafts[lang] = item.code;
    persist(lang);
    // Đổi ngôn ngữ thì effect phía trên nạp mã từ bản nháp vừa ghi.
    if (lang === selected) setCode(item.code);
    else setLanguage(lang);
  }
  async function judge(submit: boolean) {
    if (active.current || !code.trim()) return;
    active.current = true;
    setBusy(submit ? "submit" : "run");
    setConsoleTab("result");
    setError("");
    setJudgeError("");
    try {
      const fingerprint = JSON.stringify([selected, code]);
      if (!retry.current || retry.current.fingerprint !== fingerprint)
        retry.current = { fingerprint, id: crypto.randomUUID() };
      const value = await lessonCodeService.judge(
        lessonId,
        exerciseId,
        {
          request_id: submit ? retry.current.id : crypto.randomUUID(),
          language: selected,
          code,
          stdin,
        },
        submit
      );
      setResult(value);
      if (submit) {
        retry.current = null;
        // The detail cache is updated locally; no extra GET or polling after submission.
        qc.setQueryData<LessonCodeDetail>(key, (old) =>
          old ? { ...old, last_submission: value } : old
        );
        void qc.invalidateQueries({ queryKey: historyKey });
      }
    } catch (e) {
      const message = getErrorMessage(e);
      setError(message);
      setJudgeError(message);
      setResult(null);
    } finally {
      active.current = false;
      setBusy("");
    }
  }
  if (detail.isLoading)
    return (
      <p role="status" className="p-6">
        Đang tải bài tập code…
      </p>
    );
  if (detail.error || !exercise)
    return (
      <div role="alert" className="space-y-3 rounded-xl border p-5">
        <p>{getErrorMessage(detail.error)}</p>
        <Button onClick={() => detail.refetch()}>Thử lại</Button>
      </div>
    );
  if (!exercise.language?.length)
    return (
      <NonVideoLessonContent
        kind="exercise"
        lessonId={lessonId}
        courseId={courseId}
        courseSlug={courseSlug}
        title={exercise.title}
        description={exercise.description}
        completed={completed}
        onProgress={onProgress}
      />
    );
  const last = detail.data?.last_submission;
  const passed = !!last && last.total > 0 && last.score >= (exercise.pass_percentage ?? 100);
  const isDone = completed || mark.data?.status === "completed";
  return (
    <section aria-label="Bài tập lập trình" className="lesson-code-workbench">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-6 py-4">
        <div>
          <p className="text-xs font-medium text-primary-600">Bài tập lập trình</p>
          <h1 className="mt-1 text-xl font-semibold">{exercise.title}</h1>
        </div>
        {isDone ? (
          <span className="flex items-center gap-1 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Đã hoàn thành
          </span>
        ) : (
          passed && (
            <Button
              disabled={mark.isPending || !!busy}
              onClick={() => {
                if (!mark.isPending) mark.mutate();
              }}
            >
              Đánh dấu hoàn thành
            </Button>
          )
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      <div className="code-contest-columns">
        <section aria-label="Đề bài" className="code-problem-panel code-problem-body">
          <p className="text-xs text-muted-foreground">
            {exercise.difficulty} · {exercise.time_limit}s · {exercise.memory_limit} MB · Đạt{" "}
            {exercise.pass_percentage}% test
          </p>
          <p className="code-statement">{exercise.description}</p>
          {(exercise.test_cases ?? []).map((test, i) => (
            <div key={test.id} className="space-y-2 text-sm">
              <h2 className="font-semibold">Ví dụ {i + 1}</h2>
              <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3">
                Input{"\n"}
                {test.input}
              </pre>
              <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3">
                Output{"\n"}
                {test.expected_output}
              </pre>
            </div>
          ))}
          {last && (
            <div className="border-t pt-3">
              <h2 className="mb-2 text-sm font-semibold">Bài nộp gần nhất</h2>
              <p className="text-sm">
                {CODE_VERDICT_LABELS[last.status] ?? last.status} · {last.score}/100 điểm ·{" "}
                {last.passed}/{last.total} test
              </p>
            </div>
          )}
          <LessonCodeHistory
            items={history.data ?? []}
            loading={history.isLoading}
            failed={history.isError}
            disabled={!!busy}
            onOpen={openSubmission}
          />
        </section>
        <section aria-label="Làm bài" className="code-editor-panel">
          <div className="code-editor-toolbar">
            <label className="text-sm">
              Ngôn ngữ{" "}
              <select
                aria-label="Ngôn ngữ bài tập"
                className="ml-2 rounded-lg border bg-background p-2"
                value={selected}
                disabled={!!busy}
                onChange={(e) => chooseLanguage(e.target.value)}
              >
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-xs text-muted-foreground">Code editor</span>
          </div>
          <MonacoSourceEditor
            label="Mã nguồn bài tập"
            value={code}
            onChange={save}
            language={selected}
            modelPath={`lesson/${userID}/${lessonId}/${exerciseId}/${selected}`}
            readOnly={!!busy}
          />
          <div className="code-editor-actions">
            <p className="text-xs text-muted-foreground">Chạy thử không tính điểm</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!!busy || !code.trim() || !languages.length}
                onClick={() => void judge(false)}
              >
                {busy === "run" ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-1 h-4 w-4" />
                )}
                Chạy thử
              </Button>
              <Button
                className="code-submit-button"
                disabled={!!busy || !code.trim() || !languages.length}
                onClick={() => void judge(true)}
              >
                {busy === "submit" ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-1 h-4 w-4" />
                )}
                Nộp bài
              </Button>
            </div>
          </div>
          <div className="code-panel-tabs" role="tablist" aria-label="Bảng điều khiển bài tập">
            <button
              role="tab"
              aria-selected={consoleTab === "input"}
              onClick={() => setConsoleTab("input")}
            >
              <Terminal className="h-3.5 w-3.5" />
              Đầu vào tuỳ chỉnh
            </button>
            <button
              role="tab"
              aria-selected={consoleTab === "result"}
              onClick={() => setConsoleTab("result")}
            >
              <FileText className="h-3.5 w-3.5" />
              Kết quả
            </button>
          </div>
          <div className="code-panel-body">
            {consoleTab === "input" ? (
              <textarea
                aria-label="Đầu vào bài tập"
                rows={3}
                value={stdin}
                disabled={!!busy}
                onChange={(event) => setStdin(event.target.value)}
              />
            ) : busy ? (
              <p role="status" className="code-panel-empty">
                {busy === "submit" ? "Đang chấm test mẫu và test ẩn…" : "Đang chạy mã…"}
              </p>
            ) : result ? (
              <CodeJudgeResult key={result.id ?? result.status} result={result} />
            ) : judgeError ? (
              <p className="code-panel-empty text-red-700">{judgeError}</p>
            ) : last ? (
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Bài nộp gần nhất</p>
                <CodeJudgeResult result={last} />
              </div>
            ) : (
              <p className="code-panel-empty">Chạy thử hoặc nộp lời giải để xem kết quả.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
