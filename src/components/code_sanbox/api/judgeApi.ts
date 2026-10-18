import { api } from "@/lib/api-client";
import { LANGUAGES } from "../config/languages";
import type { JudgeResult } from "../types";
export async function runJudge0(langId: number, code: string, stdin: string): Promise<JudgeResult> {
  const language = LANGUAGES.find((l) => l.id === langId);
  if (!language || langId === 0) throw new Error("Ngôn ngữ không hỗ trợ chạy bằng Judge0.");
  const names: Record<string, string> = {
    ".py": "python",
    ".js": "javascript",
    ".cpp": "cpp",
    ".c": "c",
    ".sql": "sql",
  };
  const { data } = await api.post<{
    stdout: string;
    stderr: string;
    error?: string;
    exit_code: number;
    time: string;
    memory: number;
  }>("/submissions/execute", { language: names[language.ext], code, stdin }, { timeout: 40_000 });
  return {
    stdout: data.stdout,
    stderr: data.stderr,
    compile_output: data.error,
    time: data.time,
    memory: data.memory,
    status: {
      id: data.exit_code === 0 ? 3 : data.exit_code,
      description: data.exit_code === 0 ? "Accepted" : "Execution error",
    },
  };
}
