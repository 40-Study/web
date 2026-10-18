"use client";
import { MonacoSourceEditor } from "./monaco-source-editor";
import { useEffect, useRef, useState } from "react";
import { Download, Play, RotateCcw, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCodeRunner } from "@/components/code_sanbox/hooks/useCodeRunner";
import { LANGUAGES, BOILERPLATES } from "@/components/code_sanbox/config/languages";
import { useAuthStore } from "@/stores/auth.store";
const languages = LANGUAGES.filter((l) => [".py", ".cpp", ".c", ".js"].includes(l.ext));
export function CodePlayground() {
  const userID = useAuthStore((s) => s.user?.id ?? "");
  const [languageID, setLanguageID] = useState(languages[0].id);
  const [code, setCode] = useState(BOILERPLATES[languages[0].id]);
  const [stdin, setStdin] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [reset, setReset] = useState(false);
  const [ready, setReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const drafts = useRef<Record<string, { code: string; stdin: string }>>({});
  const { running, result, runCode, setResult } = useCodeRunner();
  const language = languages.find((l) => l.id === languageID) ?? languages[0];
  const key = `fortex:code-drafts:v1:${userID}`;
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || "{}");
      if (raw && typeof raw === "object") drafts.current = raw;
    } catch {
      setError("Không đọc được nháp đã lưu.");
    }
    const first = drafts.current[languages[0].id];
    if (first && typeof first.code === "string") {
      setCode(first.code);
      setStdin(typeof first.stdin === "string" ? first.stdin : "");
    }
    setReady(true);
  }, [key]);
  function save(nextCode: string, nextStdin: string, nextID = languageID) {
    setCode(nextCode);
    setStdin(nextStdin);
    drafts.current[nextID] = { code: nextCode, stdin: nextStdin };
    try {
      localStorage.setItem(key, JSON.stringify(drafts.current));
      setNotice("Đã lưu nháp trên trình duyệt");
    } catch {
      setError("Không lưu được nháp. Hãy tải mã nguồn để giữ lại.");
    }
  }
  function changeLanguage(id: number) {
    setLanguageID(id);
    const saved = drafts.current[id];
    setCode(saved?.code ?? BOILERPLATES[id]);
    setStdin(saved?.stdin ?? "");
    setResult(null);
    setError("");
    setNotice("");
  }
  async function openFile(file: File) {
    if (file.size > 60000) {
      setError("File mã nguồn tối đa 60 KB.");
      return;
    }
    const found = languages.find((l) => file.name.toLowerCase().endsWith(l.ext));
    if (!found) {
      setError("Chọn file .py, .cpp, .c hoặc .js.");
      return;
    }
    try {
      const text = await file.text();
      setLanguageID(found.id);
      save(text, "", found.id);
      setResult(null);
      setError("");
    } catch {
      setError("Không đọc được file.");
    }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `main${language.ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section
      className="mx-auto flex h-full max-w-[1600px] flex-col gap-4 p-3 sm:p-5"
      aria-label="Không gian luyện code"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Không gian luyện code</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Đọc stdin, chạy chương trình và xem stdout · Nháp lưu riêng theo tài khoản trên trình
            duyệt
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={running}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mr-1 h-4 w-4" />
            Mở file
          </Button>
          <Button size="sm" variant="outline" onClick={download}>
            <Download className="mr-1 h-4 w-4" />
            Tải mã
          </Button>
          <Button size="sm" variant="ghost" disabled={running} onClick={() => setReset(true)}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Mẫu ban đầu
          </Button>
        </div>
      </div>
      <input
        ref={fileRef}
        hidden
        type="file"
        accept=".py,.cpp,.c,.js"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void openFile(file);
          e.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
        <div className="flex min-h-[350px] min-w-0 flex-col overflow-hidden rounded-xl border">
          <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
            <label className="text-sm">
              Ngôn ngữ{" "}
              <select
                aria-label="Ngôn ngữ luyện code"
                disabled={running}
                value={languageID}
                className="ml-2 rounded-lg border bg-background p-2"
                onChange={(e) => changeLanguage(Number(e.target.value))}
              >
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-xs text-muted-foreground">
              main{language.ext} · {code.split("\n").length} dòng
            </span>
          </div>
          <MonacoSourceEditor
            label="Mã nguồn luyện code"
            value={code}
            language={language.monacoLang ?? "plaintext"}
            modelPath={`practice/${userID}/${language.id}`}
            readOnly={!ready || running}
            onChange={(value) => save(value, stdin)}
          />
        </div>
        <div className="flex min-h-0 flex-col gap-4">
          <label className="block rounded-xl border bg-card p-4 text-sm font-semibold">
            Đầu vào (stdin)
            <textarea
              aria-label="Đầu vào luyện code"
              disabled={running}
              value={stdin}
              onChange={(e) => save(code, e.target.value)}
              rows={5}
              className="mt-3 w-full rounded-lg border bg-muted/20 p-3 font-mono text-sm font-normal"
              placeholder="Nhập dữ liệu chương trình cần đọc…"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span role="status" className="text-xs text-muted-foreground">
              {running ? "Judge0 đang chạy…" : notice}
            </span>
            <Button
              disabled={!ready || running || !code.trim()}
              onClick={() => void runCode(languageID, code, stdin)}
            >
              {running ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-1 h-4 w-4" />
              )}
              Chạy mã
            </Button>
          </div>
          <section
            aria-label="Kết quả chạy code"
            className="min-h-[150px] flex-1 overflow-auto rounded-xl border bg-card p-4"
          >
            <h3 className="mb-3 text-sm font-semibold">Kết quả</h3>
            {result ? (
              <>
                <p
                  role="status"
                  className={
                    result.status?.id === 3 ? "text-sm text-green-700" : "text-sm text-destructive"
                  }
                >
                  {result.status?.id === 3 ? "Chạy thành công" : "Chạy không thành công"}
                  {result.time ? ` · ${result.time}s` : ""}
                </p>
                <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-sm">
                  {result.stdout || ""}
                </pre>
                {(result.compile_output || result.stderr) && (
                  <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-sm text-destructive">
                    {result.compile_output || result.stderr}
                  </pre>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Kết quả và lỗi sẽ xuất hiện ở đây sau khi chạy.
              </p>
            )}
          </section>
        </div>
      </div>
      {reset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Khôi phục mã mẫu"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="max-w-md space-y-4 rounded-xl bg-card p-6">
            <h3 className="font-semibold">Thay mã hiện tại bằng mã mẫu?</h3>
            <p className="text-sm text-muted-foreground">
              Bạn có thể tải mã hiện tại trước khi thay.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReset(false)}>
                Huỷ
              </Button>
              <Button
                onClick={() => {
                  save(BOILERPLATES[languageID], "");
                  setResult(null);
                  setReset(false);
                }}
              >
                Dùng mã mẫu
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
