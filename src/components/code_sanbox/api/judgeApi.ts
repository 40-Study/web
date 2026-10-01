// ─── Judge0 code execution API ───────────────────────────────────────────────
const JUDGE_TIMEOUT_MS = 30_000;

/**
 * Tín hiệu huỷ sau `ms`. Dùng `AbortSignal.timeout` khi có; trình duyệt cũ (Safari < 16, Chrome < 103) không có
 * nên tự ghép AbortController + setTimeout, huỷ bằng lý do `TimeoutError` giống bản gốc để nơi gọi nhận ra timeout.
 * `dispose` gỡ timer của nhánh tự ghép (bản gốc không cần).
 */
function timeoutSignal(ms: number): { signal: AbortSignal; dispose: () => void } {
  if (typeof AbortSignal.timeout === "function") return { signal: AbortSignal.timeout(ms), dispose: () => {} };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("The operation timed out.", "TimeoutError")), ms);
  return { signal: controller.signal, dispose: () => clearTimeout(timer) };
}

export async function runJudge0(langId: number, code: string, stdin: string) {
  // `wait=true` giữ kết nối tới khi chạy xong; không đặt hạn thì mạng treo sẽ để nút Run quay mãi.
  const { signal, dispose } = timeoutSignal(JUDGE_TIMEOUT_MS);
  try {
    const res = await fetch(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.NEXT_PUBLIC_JUDGE0_KEY ?? "YOUR_KEY",
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
        body: JSON.stringify({ language_id: langId, source_code: code, stdin }),
        signal,
      },
    );
    if (!res.ok) throw new Error("Judge0 error");
    return await res.json();
  } finally {
    dispose();
  }
}