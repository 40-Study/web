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
    } catch (err) {
      // Judge0 lỗi (mạng, timeout, HTTP lỗi): báo lỗi THẬT. Trước đây trả kết quả giả "Accepted" + "Hello, World!"
      // nên người học tưởng code chạy đạt. id 13 (Internal Error) > 3 nên OutputPanel tô đỏ như mọi lỗi.
      // So theo `name` thay vì `instanceof Error`: DOMException (lý do huỷ của AbortSignal) không phải lúc nào cũng qua được instanceof.
      const isTimeout = (err as { name?: string } | null)?.name === "TimeoutError";
      setResult({
        status: { id: 13, description: "Internal Error" },
        stderr: isTimeout
          ? "Máy chạy mã phản hồi quá lâu. Vui lòng thử lại sau."
          : "Không kết nối được máy chạy mã. Kiểm tra mạng rồi thử lại.",
      });
    }
    setRunning(false);
  }, []);

  return { running, result, setResult, runCode };
}
