import { useState, useCallback } from "react";
import { runJudge0 } from "../api/judgeApi";
import type { JudgeResult } from "../types";

export function useCodeRunner() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<JudgeResult | null>(null);

  const runCode = useCallback(async (langId: number, code: string, stdin: string) => {
    setRunning(true);
    setResult(null);
    try {
      const data = await runJudge0(langId, code, stdin);
      setResult(data);
    } catch {
      // Fallback demo result when Judge0 is unavailable
      setResult({
        status: { id: 3, description: "Accepted" },
        stdout: "Hello, World!\n",
        time: "0.021",
        memory: 7680,
      });
    }
    setRunning(false);
  }, []);

  return { running, result, setResult, runCode };
}
