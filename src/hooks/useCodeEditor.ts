"use client";

import { useState, useCallback } from "react";
import { LANGUAGES, type Language } from "@/config/languages";

export type { Language };
export { LANGUAGES };

export interface SubmissionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
}

const JUDGE0_URL =
  process.env.NEXT_PUBLIC_JUDGE0_URL ?? "http://localhost:2358";

/* ─────────────────────────────────────── */
/*  Hook                                   */
/* ─────────────────────────────────────── */
export function useCodeEditor() {
  const [selectedLang, setSelectedLang] = useState<Language>(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStdin, setShowStdin] = useState(false);

  const selectLanguage = useCallback((langId: number) => {
    const lang = LANGUAGES.find((l) => l.id === langId);
    if (!lang) return;
    setSelectedLang(lang);
    setCode(lang.defaultCode);
    setResult(null);
    setError(null);
  }, []);

  const runCode = useCallback(async () => {
    if (!code.trim()) return;
    setRunning(true);
    setResult(null);
    setError(null);

    // Some languages need extra options inside the sandbox
    const extraOptions: Record<number, object> = {
      60: { compile_options: "-p=1" },                       // Go: single-threaded compile
      62: { memory_limit: 512000 },                          // Java: JVM needs 512MB virtual
      63: { memory_limit: 1024000 },                         // Node.js 12: V8 CodeRange needs 1GB+ virtual AS
      74: { memory_limit: 1536000 },                         // TypeScript: tsc compiler (Node 12) needs ~1.5GB virtual AS
      78: { memory_limit: 512000 },                          // Kotlin: JVM needs ~512MB
      81: { memory_limit: 512000 },                          // Scala
    };

    try {
      const res = await fetch(
        `${JUDGE0_URL}/submissions?wait=true&base64_encoded=true`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_code: btoa(code),
            language_id: selectedLang.id,
            stdin: stdin ? btoa(stdin) : null,
            // Required on Docker Desktop / cgroup v2 — prevents isolate from using --cg
            enable_per_process_and_thread_time_limit: true,
            enable_per_process_and_thread_memory_limit: true,
            ...extraOptions[selectedLang.id],
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Judge0 error ${res.status}: ${text}`);
      }

      const data: SubmissionResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRunning(false);
    }
  }, [code, selectedLang.id, stdin]);

  /* ─── derived output ─── */
  const decode = (s: string | null | undefined) => {
    if (!s) return null;
    try { return atob(s); } catch { return s; }
  };

  const output =
    decode(result?.stdout) ??
    decode(result?.stderr) ??
    decode(result?.compile_output) ??
    result?.message ??
    "";

  const isError = Boolean(
    result && (result.stderr || result.compile_output || result.status.id > 3)
  );

  const statusColor = result
    ? result.status.id === 3
      ? "text-green-400"
      : result.status.id <= 2
      ? "text-yellow-400"
      : "text-red-400"
    : "";

  return {
    /* state */
    selectedLang,
    code,
    setCode,
    stdin,
    setStdin,
    result,
    running,
    error,
    showStdin,
    setShowStdin,
    /* actions */
    selectLanguage,
    runCode,
    /* derived */
    output,
    isError,
    statusColor,
    languages: LANGUAGES,
  };
}
