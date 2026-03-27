"use client";

import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

/** Maps exercise difficulty to Vietnamese label + color style */
const DIFFICULTY_CONFIG = {
  EASY: { label: "DỄ", className: "bg-green-100 text-green-700 border-green-200" },
  MEDIUM: { label: "TRUNG BÌNH", className: "bg-orange-100 text-orange-700 border-orange-200" },
  HARD: { label: "KHÓ", className: "bg-red-100 text-red-700 border-red-200" },
} as const;

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface ProblemPanelProps {
  problemId: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  description: string;
  examples: Example[];
  constraints: string[];
}

/** Renders inline code tokens (backtick-wrapped) with monospace highlight */
function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={i} className="px-1 py-0.5 bg-gray-100 rounded text-sm font-mono">
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/**
 * Left panel of the code exercise UI.
 * Displays problem statement, examples, and constraints.
 */
export function CodeExerciseProblemPanel({
  problemId,
  title,
  difficulty,
  description,
  examples,
  constraints,
}: ProblemPanelProps) {
  const diff = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header: difficulty badge + problem ID */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "px-2.5 py-0.5 rounded border text-xs font-bold tracking-wide",
            diff.className
          )}
        >
          {diff.label}
        </span>
        <span className="text-sm text-gray-400">ID: {problemId}</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900">Bai tap: {title}</h1>

      {/* Description */}
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{description}</p>

      {/* Examples */}
      <div className="space-y-4">
        {examples.map((ex, idx) => (
          <div key={idx}>
            <div className="flex items-center gap-2 mb-2 font-medium text-gray-700">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span>Vi du {idx + 1}:</span>
            </div>
            <div className="rounded-md bg-gray-50 border border-gray-200 p-4 space-y-2 text-sm font-mono">
              <div>
                <span className="text-gray-500">Input: </span>
                <span className="text-gray-900">{ex.input}</span>
              </div>
              <div>
                <span className="text-gray-500">Output: </span>
                <span className="text-gray-900">{ex.output}</span>
              </div>
              {ex.explanation && (
                <div className="font-sans text-gray-600 pt-1 border-t border-gray-200">
                  {ex.explanation}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Constraints */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-2">Rang buoc:</h3>
        <ul className="space-y-1.5">
          {constraints.map((c, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>{renderInlineCode(c)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
