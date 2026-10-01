// ─── Judge0 code execution API ───────────────────────────────────────────────
const JUDGE_TIMEOUT_MS = 30_000;

export async function runJudge0(langId: number, code: string, stdin: string) {
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
      // `wait=true` giữ kết nối tới khi chạy xong; không đặt hạn thì mạng treo sẽ để nút Run quay mãi.
      signal: AbortSignal.timeout(JUDGE_TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new Error("Judge0 error");
  return res.json();
}
