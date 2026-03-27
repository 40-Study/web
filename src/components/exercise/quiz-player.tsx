"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Flag, Clock, Send, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizQuestion {
  id: string;
  question: string;
  options: Array<{ label: string; text: string }>;
  correctAnswer: string;
  explanation: string;
}

export interface QuizPlayerProps {
  quiz: {
    id: string;
    title: string;
    totalQuestions: number;
    timeLimit: number; // seconds
    questions: QuizQuestion[];
  };
  onSubmit: (answers: Record<string, string>) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Render text with `code` backtick spans highlighted */
function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <span key={i} className="bg-gray-100 rounded px-1 font-mono text-sm">
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuizPlayer({ quiz, onSubmit }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit);

  const total = quiz.questions.length;
  const question = quiz.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onSubmit(answers);
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, answers, onSubmit]);

  const selectAnswer = useCallback(
    (label: string) => setAnswers((prev) => ({ ...prev, [question.id]: label })),
    [question.id]
  );

  const toggleFlag = useCallback(
    () =>
      setFlagged((prev) => {
        const next = new Set(prev);
        next.has(question.id) ? next.delete(question.id) : next.add(question.id);
        return next;
      }),
    [question.id]
  );

  const isFlagged = flagged.has(question.id);
  const selectedLabel = answers[question.id];

  return (
    <div className="flex gap-4 p-4 bg-gray-50 min-h-screen">
      {/* ── Left: Question Panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Kiểm tra: {quiz.title}</h2>
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <span>Câu {currentIndex + 1} của {total}</span>
            <span>Đã trả lời: {answeredCount}/{total}</span>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
          <p className="text-gray-800 font-medium mb-5 leading-relaxed">
            <InlineText text={question.question} />
          </p>

          {/* Answer options */}
          <div className="space-y-3">
            {question.options.map((opt) => {
              const isSelected = selectedLabel === opt.label;
              return (
                <button
                  key={opt.label}
                  onClick={() => selectAnswer(opt.label)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all",
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  <span
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                      isSelected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {opt.label}
                  </span>
                  <span className="flex-1 text-gray-800 text-sm">
                    <InlineText text={opt.text} />
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-blue-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" /> Câu trước
          </button>

          <button
            onClick={toggleFlag}
            className={cn(
              "p-2 rounded-lg border transition",
              isFlagged
                ? "border-yellow-400 bg-yellow-50 text-yellow-500"
                : "border-gray-200 text-gray-400 hover:text-yellow-500"
            )}
            title="Đánh dấu câu hỏi"
          >
            <Flag className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))}
            disabled={currentIndex === total - 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Tiếp theo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Right: Sidebar ───────────────────────────────────────────────── */}
      <div className="w-56 flex flex-col gap-4 shrink-0">
        {/* Timer */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            <Clock className="w-3 h-3" /> Thời gian
          </div>
          <span
            className={cn(
              "text-3xl font-mono font-bold",
              timeLeft <= 60 ? "text-red-500" : "text-gray-800"
            )}
          >
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Question map */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Bản đồ câu hỏi
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {quiz.questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "h-8 w-full rounded text-xs font-semibold transition",
                    isCurrent
                      ? "bg-gray-800 text-white"
                      : isAnswered
                      ? "bg-blue-500 text-white"
                      : "border border-gray-300 text-gray-500 hover:border-blue-400"
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={() => onSubmit(answers)}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition"
        >
          Nộp bài <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
