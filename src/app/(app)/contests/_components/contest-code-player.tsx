"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Code2,
  Play,
  Send,
  Loader2,
  Trophy,
  Clock3,
  CheckCircle2,
  History,
  FileText,
  Terminal,
  RotateCcw,
} from "lucide-react";
import { ContestLeaderboard } from "./contest-leaderboard";
import { contestKeys } from "@/hooks/queries/use-contests";
import { Button } from "@/components/ui/button";
import { contestCodeService } from "@/services/contest-code.service";
import { useAuthStore } from "@/stores/auth.store";
import { MonacoSourceEditor } from "@/components/code-workspace/monaco-source-editor";
import {
  CodeJudgeResult,
  CODE_VERDICT_LABELS,
} from "@/components/code-workspace/code-judge-result";
import { getErrorMessage } from "@/lib/error-messages";
import type { ContestCodeResult, ContestCodeSession, ContestDetail } from "@/types/contest";

const LANGS = [
  { id: "python", name: "Python 3" },
  { id: "cpp", name: "C++" },
  { id: "javascript", name: "JavaScript" },
  { id: "java", name: "Java" },
  { id: "go", name: "Go" },
];
const STARTERS: Record<string, string> = {
  python:
    "# Đọc dữ liệu từ stdin và in kết quả ra stdout\na, b = map(int, input().split())\nprint(a + b)\n",
  cpp: '#include <iostream>\nusing namespace std;\nint main() {\n  long long a,b; cin >> a >> b;\n  cout << a + b << "\\n";\n}\n',
  javascript:
    'const fs = require("fs");\nconst [a,b] = fs.readFileSync(0,"utf8").trim().split(/\\s+/).map(Number);\nconsole.log(a + b);\n',
  java: "import java.util.*;\npublic class Main { public static void main(String[] args) { Scanner s=new Scanner(System.in); long a=s.nextLong(),b=s.nextLong(); System.out.println(a+b); } }\n",
  go: 'package main\nimport "fmt"\nfunc main() { var a,b int; fmt.Scan(&a,&b); fmt.Println(a+b) }\n',
};

export function ContestCodePlayer({
  detail,
  readOnly = false,
}: {
  detail: ContestDetail;
  readOnly?: boolean;
}) {
  const userID = useAuthStore((s) => s.user?.id ?? "");
  const qc = useQueryClient();
  const key = ["contest-code", detail.id, userID] as const;
  const session = useQuery({
    queryKey: key,
    queryFn: () => contestCodeService.session(detail.id),
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [activeTab, setActiveTab] = useState<
    "problems" | "submissions" | "leaderboard" | "summary"
  >(readOnly ? "summary" : "problems");
  const [consoleTab, setConsoleTab] = useState<"input" | "result">("input");
  const [problemID, setProblemID] = useState("");
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ContestCodeResult | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [now, setNow] = useState(Date.now());
  const active = useRef(false);
  const retry = useRef<{ fingerprint: string; id: string } | null>(null);
  const drafts = useRef<Record<string, string>>({});
  const received = useRef({ local: Date.now(), server: Date.now() });
  const problem =
    session.data?.problems.find((p) => p.id === problemID) ?? session.data?.problems[0];
  const activeProblemID = problem?.id;
  const sampleInput = problem?.samples[0]?.input ?? "";
  const storageKey = `fortex:contest-code:${userID}:${detail.id}`;
  useEffect(() => {
    if (session.data?.finished_at) setActiveTab("summary");
  }, [session.data?.finished_at]);
  useEffect(() => {
    const serverTime = session.data?.server_time;
    if (!serverTime) return;
    received.current = { local: Date.now(), server: new Date(serverTime).getTime() };
  }, [session.data?.server_time]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (saved && typeof saved === "object") drafts.current = saved;
    } catch {
      drafts.current = {};
    }
  }, [storageKey]);
  useEffect(() => {
    if (!activeProblemID) return;
    const name = `${activeProblemID}:${language}`;
    setCode(typeof drafts.current[name] === "string" ? drafts.current[name] : "");
    setStdin(sampleInput);
    setResult(null);
  }, [activeProblemID, sampleInput, language]);
  useEffect(() => {
    if (!session.data?.started_at || session.data.finished_at) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [session.data?.started_at, session.data?.finished_at]);
  const actualNow = received.current.server + now - received.current.local;
  const remaining = session.data?.deadline_at
    ? Math.max(0, Math.ceil((new Date(session.data.deadline_at).getTime() - actualNow) / 1000))
    : 0;
  const canCode = !!session.data?.can_submit && remaining > 0 && !readOnly;
  function saveCode(value: string) {
    setCode(value);
    if (problem) {
      drafts.current[`${problem.id}:${language}`] = value;
      try {
        localStorage.setItem(storageKey, JSON.stringify(drafts.current));
      } catch {
        setError("Không lưu được nháp trên trình duyệt. Hãy sao chép mã trước khi rời trang.");
      }
    }
  }
  async function startOrFinish(finish = false) {
    if (active.current) return;
    active.current = true;
    setBusy(finish ? "finish" : "start");
    setError("");
    try {
      const value = await (finish
        ? contestCodeService.finish(detail.id)
        : contestCodeService.start(detail.id));
      qc.setQueryData(key, value);
      setNow(Date.now());
      setConfirm(false);
      if (finish) {
        setActiveTab("summary");
        qc.invalidateQueries({
          queryKey: [...contestKeys.all, "leaderboard", detail.id],
          refetchType: "none",
        });
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      active.current = false;
      setBusy("");
    }
  }
  async function judge(submit: boolean) {
    if (active.current || !problem || !canCode || !code.trim()) return;
    active.current = true;
    setBusy(submit ? "submit" : "run");
    setConsoleTab("result");
    setError("");
    try {
      const fingerprint = JSON.stringify([problem.id, language, code]);
      if (!retry.current || retry.current.fingerprint !== fingerprint)
        retry.current = { fingerprint, id: crypto.randomUUID() };
      const value = await contestCodeService.judge(
        detail.id,
        {
          request_id: submit ? retry.current.id : crypto.randomUUID(),
          problem_id: problem.id,
          language,
          code,
          stdin,
        },
        submit
      );
      setResult(value);
      setConsoleTab("result");
      if (submit) {
        retry.current = null;
        qc.invalidateQueries({
          queryKey: [...contestKeys.all, "leaderboard", detail.id],
          refetchType: "none",
        });
        qc.setQueryData<ContestCodeSession>(key, (old) => {
          if (!old) return old;
          const submissions = [value, ...old.submissions.filter((s) => s.id !== value.id)];
          const best = new Map<string, number>();
          submissions.forEach((s) =>
            best.set(s.problem_id, Math.max(best.get(s.problem_id) ?? 0, s.score))
          );
          return {
            ...old,
            submissions,
            score: Array.from(best.values()).reduce((a, b) => a + b, 0),
          };
        });
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      active.current = false;
      setBusy("");
    }
  }
  if (session.isLoading)
    return (
      <div className="p-8" role="status">
        Đang tải đề lập trình…
      </div>
    );
  if (session.error || !session.data)
    return (
      <div role="alert" className="space-y-4 p-8">
        <p>{getErrorMessage(session.error)}</p>
        <Button variant="outline" onClick={() => session.refetch()}>
          Thử lại
        </Button>
        <Link className="ml-3 underline" href={`/contests/${detail.slug}`}>
          Về cuộc thi
        </Link>
      </div>
    );
  const data = session.data;
  const ended = !!data.finished_at || (!!data.started_at && remaining === 0);
  const solved = data.problems.filter((item) =>
    data.submissions.some(
      (submission) => submission.problem_id === item.id && submission.score >= item.points
    )
  ).length;
  const fileLabel = LANGS.find((item) => item.id === language)?.name ?? language;
  return (
    <div className="coding-contest">
      <header className="code-contest-header">
        <Link
          className="code-contest-back"
          aria-label="Về cuộc thi"
          href={`/contests/${detail.slug}`}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="code-contest-title">
          <small>FORTEX / CONTEST / LẬP TRÌNH</small>
          <h1>{detail.title}</h1>
        </div>
        <div className="code-contest-score">
          Điểm tốt nhất
          <strong>
            {data.score}
            <span className="text-xs font-normal text-slate-400"> / {data.total_points}</span>
          </strong>
        </div>
        {data.started_at && !ended && (
          <span role="timer" className="code-contest-timer">
            <Clock3 className="h-4 w-4" />
            {String(Math.floor(remaining / 3600)).padStart(2, "0")}:
            {String(Math.floor(remaining / 60) % 60).padStart(2, "0")}:
            {String(remaining % 60).padStart(2, "0")}
          </span>
        )}
        {canCode && (
          <Button variant="outline" size="sm" disabled={!!busy} onClick={() => setConfirm(true)}>
            Kết thúc bài thi
          </Button>
        )}
        {ended && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã hoàn thành
          </span>
        )}
      </header>
      <nav className="code-contest-nav" role="tablist" aria-label="Nội dung cuộc thi code">
        <button
          role="tab"
          aria-selected={activeTab === "problems"}
          onClick={() => setActiveTab("problems")}
        >
          <Code2 className="h-3.5 w-3.5" />
          Đề bài
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "submissions"}
          onClick={() => setActiveTab("submissions")}
        >
          <History className="h-3.5 w-3.5" />
          Bài nộp của tôi <span className="text-[10px]">{data.submissions.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "leaderboard"}
          onClick={() => setActiveTab("leaderboard")}
        >
          <Trophy className="h-3.5 w-3.5" />
          Bảng xếp hạng
        </button>
        {(ended || readOnly) && (
          <button
            role="tab"
            aria-selected={activeTab === "summary"}
            onClick={() => setActiveTab("summary")}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Kết quả của tôi
          </button>
        )}
      </nav>
      <div className="code-contest-content">
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
          >
            {error}
          </p>
        )}
        {!data.started_at && !readOnly && (
          <div className="code-summary flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2>Sẵn sàng thử sức?</h2>
              <p>
                {data.problems.length} bài lập trình · {detail.duration_minutes} phút · Tính điểm
                cao nhất mỗi bài.
              </p>
            </div>
            <Button
              className="code-submit-button"
              disabled={!!busy}
              onClick={() => void startOrFinish()}
            >
              {busy === "start" ? "Đang bắt đầu…" : "Bắt đầu thi code"}
            </Button>
          </div>
        )}
        {activeTab === "summary" && (
          <section className="code-summary" aria-label="Tổng kết bài thi">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <h2>{ended ? "Bài thi đã được ghi nhận" : "Kết quả hiện tại"}</h2>
            <p>Mọi lần nộp được lưu. Điểm mỗi bài là kết quả tốt nhất bạn đạt được.</p>
            <div className="code-summary-stats">
              <div>
                <small>TỔNG ĐIỂM</small>
                <strong>
                  {data.score}/{data.total_points}
                </strong>
              </div>
              <div>
                <small>BÀI GIẢI ĐÚNG</small>
                <strong>
                  {solved}/{data.problems.length}
                </strong>
              </div>
              <div>
                <small>LẦN NỘP</small>
                <strong>{data.submissions.length}</strong>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="code-submit-button" onClick={() => setActiveTab("leaderboard")}>
                <Trophy className="mr-2 h-4 w-4" />
                Xem bảng xếp hạng
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("submissions")}>
                Xem lại bài nộp
              </Button>
            </div>
          </section>
        )}
        {activeTab === "leaderboard" && (
          <section className="mx-auto max-w-4xl rounded-xl border bg-white p-6">
            <div className="mb-5 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold">Bảng xếp hạng cuộc thi</h2>
            </div>
            <ContestLeaderboard
              contestId={detail.id}
              phase={detail.phase}
              endTime={detail.end_time}
              serverTime={detail.server_time}
              live
            />
          </section>
        )}
        {activeTab === "submissions" && (
          <section className="mx-auto max-w-5xl overflow-hidden rounded-xl border bg-white">
            <div className="border-b p-5">
              <h2 className="font-semibold">Bài nộp của tôi</h2>
              <p className="mt-1 text-xs text-slate-400">
                Chọn một bài nộp để xem kết quả từng test.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="code-history-table">
                <thead>
                  <tr>
                    <th>BÀI</th>
                    <th>NGÔN NGỮ</th>
                    <th>KẾT QUẢ</th>
                    <th>ĐIỂM</th>
                    <th>THỜI GIAN</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td>
                        {data.problems.find((item) => item.id === submission.problem_id)?.title}
                      </td>
                      <td>{submission.language}</td>
                      <td
                        className={
                          submission.status === "ACCEPTED" ? "text-emerald-600" : "text-red-500"
                        }
                      >
                        {CODE_VERDICT_LABELS[submission.status] ?? submission.status}
                      </td>
                      <td className="font-semibold">
                        {submission.score}/{submission.max_score}
                      </td>
                      <td>{submission.execution_time_ms} ms</td>
                      <td>
                        <button
                          className="text-emerald-700 hover:underline"
                          onClick={() => {
                            setResult(submission);
                            setConsoleTab("result");
                          }}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result?.id && (
              <div className="border-t p-5">
                <h3 className="mb-3 text-sm font-semibold">
                  {data.problems.find((item) => item.id === result.problem_id)?.title} · Chi tiết
                  bài nộp
                </h3>
                <CodeJudgeResult key={result.id} result={result} />
              </div>
            )}
            {!data.submissions.length && (
              <p className="code-panel-empty">
                Chưa có bài nộp. Chạy thử, kiểm tra và nộp lời giải đầu tiên của bạn.
              </p>
            )}
          </section>
        )}
        {activeTab === "problems" && (
          <div className="code-contest-columns">
            <section className="code-problem-panel" aria-label="Đề bài lập trình">
              <nav className="code-problem-tabs" aria-label="Danh sách bài lập trình">
                {data.problems.map((item, index) => (
                  <button
                    key={item.id}
                    aria-pressed={problem?.id === item.id}
                    disabled={!!busy}
                    onClick={() => {
                      setProblemID(item.id);
                      setResult(null);
                    }}
                  >
                    <span className="font-semibold">{String.fromCharCode(65 + index)}</span>
                    {item.title}
                    {data.submissions.some(
                      (submission) =>
                        submission.problem_id === item.id && submission.score >= item.points
                    ) && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                  </button>
                ))}
              </nav>
              {problem && (
                <div className="code-problem-body">
                  <div className="code-problem-meta">
                    <span>
                      {(
                        { EASY: "Dễ", MEDIUM: "Trung bình", HARD: "Khó" } as Record<string, string>
                      )[problem.difficulty] ?? problem.difficulty}
                    </span>
                    <span>{problem.points} điểm</span>
                    <span>{problem.time_limit_seconds}s</span>
                    <span>{problem.memory_limit_mb} MB</span>
                  </div>
                  <h2>{problem.title}</h2>
                  <p className="code-statement">{problem.description}</p>
                  {problem.samples.map((sample, index) => (
                    <div className="code-example" key={index}>
                      <h3>Ví dụ {index + 1}</h3>
                      <div>
                        <pre>
                          <small>Đầu vào</small>
                          {sample.input || "(trống)"}
                        </pre>
                        <pre>
                          <small>Kết quả mong đợi</small>
                          {sample.expected_output || "(trống)"}
                        </pre>
                      </div>
                    </div>
                  ))}
                  <div className="mt-7 border-t pt-4 text-[11px] leading-6 text-slate-400">
                    Đọc dữ liệu từ đầu vào chuẩn (stdin) và in kết quả ra đầu ra chuẩn (stdout).
                    Chạy thử không tính điểm; nộp bài để chấm cả test ẩn.
                  </div>
                </div>
              )}
            </section>
            <section className="code-editor-panel" aria-label="Trình soạn thảo bài thi">
              <div className="code-editor-toolbar">
                <span>
                  <Code2 className="h-3.5 w-3.5" />
                  Trình soạn thảo
                </span>
                <label>
                  <span className="sr-only">Ngôn ngữ lập trình</span>
                  <select
                    aria-label="Ngôn ngữ lập trình"
                    value={language}
                    disabled={!!busy}
                    onChange={(event) => setLanguage(event.target.value)}
                  >
                    {LANGS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                {canCode && (
                  <button
                    title="Chèn mẫu đọc stdin khi mã đang trống"
                    aria-label="Chèn mẫu đọc stdin"
                    disabled={!!code.trim() || !!busy}
                    onClick={() => saveCode(STARTERS[language])}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <MonacoSourceEditor
                label="Mã nguồn bài thi"
                value={code}
                language={language}
                modelPath={`contest/${userID}/${detail.id}/${activeProblemID}/${language}`}
                readOnly={!canCode || !!busy}
                onChange={saveCode}
              />
              <div className="code-editor-actions">
                <p>
                  {fileLabel} · {canCode ? "Nháp đã lưu trên trình duyệt" : "Chế độ xem lại"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canCode || !!busy || !code.trim()}
                  onClick={() => void judge(false)}
                >
                  {busy === "run" ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Chạy thử
                </Button>
                <Button
                  size="sm"
                  className="code-submit-button"
                  disabled={!canCode || !!busy || !code.trim()}
                  onClick={() => void judge(true)}
                >
                  {busy === "submit" ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Nộp bài
                </Button>
              </div>
              <div className="code-panel-tabs" role="tablist" aria-label="Bảng điều khiển code">
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
                  {result && (
                    <span
                      className={result.status === "ACCEPTED" ? "text-emerald-600" : "text-red-500"}
                    >
                      ●
                    </span>
                  )}
                </button>
              </div>
              <div className="code-panel-body">
                {consoleTab === "input" ? (
                  <textarea
                    aria-label="Đầu vào chạy thử"
                    value={stdin}
                    disabled={!!busy}
                    onChange={(event) => setStdin(event.target.value)}
                    rows={3}
                  />
                ) : busy ? (
                  <p role="status" className="code-panel-empty">
                    Đang {busy === "submit" ? "chấm test mẫu và test ẩn" : "chạy mã"}…
                  </p>
                ) : result ? (
                  <CodeJudgeResult key={result.id ?? result.created_at} result={result} />
                ) : (
                  <p className="code-panel-empty">Chạy thử hoặc nộp bài để xem kết quả tại đây.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
      {confirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Kết thúc bài thi code"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="max-w-md space-y-4 rounded-xl bg-card p-6 shadow-xl">
            <h2 className="font-semibold">Kết thúc bài thi?</h2>
            <p className="text-sm text-muted-foreground">
              Giữ điểm cao nhất của mỗi bài đã nộp. Sau khi kết thúc, bạn không thể nộp thêm.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled={!!busy} onClick={() => setConfirm(false)}>
                Tiếp tục làm
              </Button>
              <Button disabled={!!busy} onClick={() => void startOrFinish(true)}>
                Xác nhận kết thúc
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
