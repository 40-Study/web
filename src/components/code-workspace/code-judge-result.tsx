"use client";
import { useState } from "react";
import { CheckCircle2, XCircle, LockKeyhole, Clock3 } from "lucide-react";
import type { ContestCodeResult } from "@/types/contest";
import "./workbench.css";

export const CODE_VERDICT_LABELS: Record<string, string> = {
  ACCEPTED: "Chấp nhận",
  WRONG_ANSWER: "Sai kết quả",
  TIME_LIMIT: "Quá thời gian",
  MEMORY_LIMIT: "Quá bộ nhớ",
  COMPILATION_ERROR: "Lỗi biên dịch",
  RUNTIME_ERROR: "Lỗi khi chạy",
};
export function CodeJudgeResult({ result }: { result: ContestCodeResult }) {
  const [selected, setSelected] = useState(0);
  const test = result.tests[Math.min(selected, result.tests.length - 1)];
  const accepted = result.status === "ACCEPTED";
  return (
    <div className="judge-result" aria-label="Kết quả Judge0">
      <div role="status" className="judge-result-banner" data-passed={accepted}>
        {accepted ? (
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 shrink-0" />
        )}
        <div className="flex-1">
          <strong>{CODE_VERDICT_LABELS[result.status] ?? result.status}</strong>
          <p className="mt-1 text-[10px] opacity-75">
            {result.passed}/{result.total} test {result.id ? "đạt" : "chạy thành công"} ·{" "}
            {result.id ? `${result.score}/${result.max_score} điểm` : "Chạy thử, không tính điểm"}
          </p>
        </div>
        <span className="flex items-center gap-1 text-[10px]">
          <Clock3 className="h-3 w-3" />
          {result.execution_time_ms} ms
        </span>
      </div>
      <div className="judge-test-grid" aria-label="Các test đã chấm">
        {result.tests.map((item, index) => (
          <button
            key={item.number}
            type="button"
            aria-pressed={Math.min(selected, result.tests.length - 1) === index}
            onClick={() => setSelected(index)}
            className="inline-flex items-center gap-1.5"
          >
            {item.status === "ACCEPTED" ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            ) : (
              <XCircle className="h-3 w-3 text-red-500" />
            )}
            Test {item.number}
            {item.hidden && <LockKeyhole className="h-2.5 w-2.5" />}
          </button>
        ))}
      </div>
      {test && (
        <div className="judge-test-detail">
          <p className="text-[11px] font-medium">
            Test {test.number} · {CODE_VERDICT_LABELS[test.status] ?? test.status}
          </p>
          {test.hidden ? (
            <p className="mt-2 text-[11px] text-slate-400">
              Test ẩn. Đầu vào và đáp án được giữ kín.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[10px] text-slate-400">ĐẦU RA CỦA BẠN</p>
                <pre>{test.output || "(trống)"}</pre>
              </div>
              {test.expected !== undefined && (
                <div>
                  <p className="text-[10px] text-slate-400">KẾT QUẢ MONG ĐỢI</p>
                  <pre>{test.expected || "(trống)"}</pre>
                </div>
              )}
              {test.error && <pre className="text-red-600 sm:col-span-2">{test.error}</pre>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
