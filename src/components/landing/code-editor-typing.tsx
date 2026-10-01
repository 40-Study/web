"use client";

import { useEffect, useMemo, useState } from "react";
import { Terminal } from "lucide-react";
import { useRevealPhase } from "@/components/landing/use-reveal-phase";

type Segment = { cls: string; text: string };

// Màu cú pháp trên nền slate-950, mọi cặp đều >= 4.5:1.
const KW = "text-pink-400";
const STR = "text-green-300";
const FN = "text-yellow-200";
const TAG = "text-primary-400";
const CMT = "text-slate-400";
const TXT = "text-slate-300";

// Bài học thật của khóa "Lập trình Web với React": useState.
const CODE: Segment[] = [
  { cls: CMT, text: "// Bài 5: useState trong React\n" },
  { cls: KW, text: "import" },
  { cls: TXT, text: " { useState } " },
  { cls: KW, text: "from" },
  { cls: STR, text: ' "react"' },
  { cls: TXT, text: ";\n\n" },
  { cls: KW, text: "export function" },
  { cls: FN, text: " LessonCounter" },
  { cls: TXT, text: "() {\n  " },
  { cls: KW, text: "const" },
  { cls: TXT, text: " [count, setCount] = " },
  { cls: FN, text: "useState" },
  { cls: TXT, text: "(0);\n\n  " },
  { cls: KW, text: "return" },
  { cls: TXT, text: " (\n    " },
  { cls: TAG, text: "<button" },
  { cls: TXT, text: " onClick={() => " },
  { cls: FN, text: "setCount" },
  { cls: TXT, text: "(count + 1)}" },
  { cls: TAG, text: ">" },
  { cls: TXT, text: "\n      Đã học {count} bài\n    " },
  { cls: TAG, text: "</button>" },
  { cls: TXT, text: "\n  );\n}" },
];

const TOTAL = CODE.reduce((n, s) => n + s.text.length, 0);
const STEP_MS = 28;
const CHARS_PER_STEP = 2;

function clip(limit: number): Segment[] {
  const out: Segment[] = [];
  let left = limit;
  for (const seg of CODE) {
    if (left <= 0) break;
    out.push(left >= seg.text.length ? seg : { cls: seg.cls, text: seg.text.slice(0, left) });
    left -= seg.text.length;
  }
  return out;
}

/**
 * Khung soạn code gõ dần khi cuộn tới. HTML server-render chứa toàn bộ code;
 * chiều cao cố định theo số dòng nên không gây layout shift khi gõ.
 * Reduced-motion hoặc không có JS: hiện đủ code ngay.
 */
export function CodeEditorTyping({ className }: { className?: string }) {
  const { ref, phase } = useRevealPhase<HTMLDivElement>(0.3);
  const [typed, setTyped] = useState(TOTAL);

  useEffect(() => {
    if (phase === "armed") {
      setTyped(0);
      return;
    }
    if (phase !== "playing") return;
    let n = 0;
    const id = window.setInterval(() => {
      n = Math.min(n + CHARS_PER_STEP, TOTAL);
      setTyped(n);
      if (n >= TOTAL) window.clearInterval(id);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  const segments = useMemo(() => clip(typed), [typed]);
  const typing = typed < TOTAL;

  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-slate-800 bg-slate-950 shadow-card ${className ?? ""}`}
    >
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
        <span className="h-3 w-3 rounded-full bg-green-500/80" />
        <span className="ml-3 font-mono text-xs text-slate-400">lesson-counter.tsx</span>
        <Terminal className="ml-auto h-4 w-4 text-slate-500" aria-hidden />
      </div>
      <pre className="min-h-[24rem] overflow-hidden whitespace-pre-wrap break-words p-4 text-left font-mono text-[13px] leading-6 sm:min-h-[20.5rem] sm:p-5">
        <code data-testid="showcase-code">
          {segments.map((seg, i) => (
            <span key={i} className={seg.cls}>
              {seg.text}
            </span>
          ))}
          {typing && <span className="animate-pulse text-primary-400">|</span>}
        </code>
      </pre>
    </div>
  );
}
