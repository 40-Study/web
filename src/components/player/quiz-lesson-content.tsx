"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, Send, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  UnsureToggle,
  UnsureSummary,
  toggleUnsure,
  countUnsure,
} from "@/components/quiz/unsure-toggle";
import type { StartQuizResponse, AttemptQuestion } from "@/services/quiz.service";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Legacy format for demo/mock data */
export interface QuizQuestion {
  id: string;
  question: string;
  /** Code snippets to highlight in question (optional) */
  codeSnippets?: string[];
  options: {
    key: string; // A, B, C, D
    text: string;
  }[];
  correctAnswer?: string; // For showing results
}

export interface QuizData {
  id: string;
  title: string;
  questions: QuizQuestion[];
  timeLimitMinutes: number;
}

/** API format - matches StartQuizResponse */
export interface ApiQuizData {
  attempt_id: string;
  quiz_id: string;
  title: string;
  time_limit_minutes?: number;
  questions: AttemptQuestion[];
  started_at: string;
}

interface QuizLessonContentProps {
  /** Demo/mock quiz data format */
  quiz?: QuizData;
  /** API quiz data format (from startQuiz) */
  apiQuiz?: ApiQuizData;
  /** Submit answers - for demo format: Record<questionId, optionKey>, for API: Array<{question_id, selected_answer_ids}> */
  onSubmit: (
    answers: Record<string, string> | Array<{ question_id: string; selected_answer_ids: string[] }>,
    timeSpentSeconds: number
  ) => void | boolean | Promise<void | boolean>;
  /** Auto-save answer callback (optional) */
  onSaveAnswer?: (questionId: string, answerIds: string[]) => void;
  onBack?: () => void;
  /** Is submitting */
  isSubmitting?: boolean;
}

// ─── Helper: Format time ─────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// ─── Helper: Render question with code highlights ────────────────────────────

function renderQuestionText(text: string, codeSnippets?: string[]) {
  if (!codeSnippets || codeSnippets.length === 0) {
    return <span>{text}</span>;
  }

  const result = text;
  const parts: (string | { type: "code"; content: string })[] = [];

  // Simple approach: replace code snippets with markers then split
  let tempText = text;
  const markers: { original: string; marker: string }[] = [];

  codeSnippets.forEach((snippet, idx) => {
    const marker = `__CODE_${idx}__`;
    markers.push({ original: snippet, marker });
    tempText = tempText.replace(snippet, marker);
  });

  // Split by markers and rebuild
  let currentText = tempText;
  markers.forEach(({ original, marker }) => {
    const splitParts = currentText.split(marker);
    if (splitParts.length > 1) {
      parts.push(splitParts[0]);
      parts.push({ type: "code", content: original });
      currentText = splitParts.slice(1).join(marker);
    }
  });
  if (currentText) parts.push(currentText);

  return (
    <>
      {parts.map((part, idx) =>
        typeof part === "string" ? (
          <span key={idx}>{part}</span>
        ) : (
          <code
            key={idx}
            className="px-1.5 py-0.5 mx-0.5 bg-blue-100 text-blue-600 rounded font-mono text-base dark:bg-blue-500/15 dark:text-blue-400"
          >
            {part.content}
          </code>
        )
      )}
    </>
  );
}

// ─── Normalize Data ──────────────────────────────────────────────────────────

interface NormalizedQuestion {
  id: string;
  text: string;
  codeSnippets?: string[];
  options: { id: string; key: string; text: string }[];
}

function normalizeQuestions(quiz?: QuizData, apiQuiz?: ApiQuizData): NormalizedQuestion[] {
  if (apiQuiz?.questions) {
    return apiQuiz.questions.map((q, idx) => ({
      id: q.id,
      text: q.question_text,
      options: q.answers.map((a, aIdx) => ({
        id: a.id,
        key: String.fromCharCode(65 + aIdx), // A, B, C, D...
        text: a.answer_text,
      })),
    }));
  }

  if (quiz?.questions) {
    return quiz.questions.map((q) => ({
      id: q.id,
      text: q.question,
      codeSnippets: q.codeSnippets,
      options: q.options.map((o, idx) => ({
        id: `${q.id}-${o.key}`,
        key: o.key,
        text: o.text,
      })),
    }));
  }

  return [];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function QuizLessonContent({
  quiz,
  apiQuiz,
  onSubmit,
  onSaveAnswer,
  onBack,
  isSubmitting,
}: QuizLessonContentProps) {
  const isApiMode = !!apiQuiz;
  const title = apiQuiz?.title || quiz?.title || "Quiz";
  const timeLimitMins = apiQuiz?.time_limit_minutes || quiz?.timeLimitMinutes || 15;
  const questions = normalizeQuestions(quiz, apiQuiz);

  const [currentIndex, setCurrentIndex] = useState(0);
  // For API mode: store answer IDs. For demo mode: store option keys
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const submittingRef = useRef(false);
  const autoSubmittedRef = useRef(false);
  const [submitError, setSubmitError] = useState("");
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(timeLimitMins * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  const handleSelectAnswer = (optionId: string, optionKey: string) => {
    if (isSubmitted || isSubmitting) return;
    // Store the option ID for API mode, but we also track by question ID
    const answerValue = isApiMode ? optionId : optionKey;
    if (answersRef.current[currentQuestion.id] === answerValue) return;
    const next = { ...answersRef.current, [currentQuestion.id]: answerValue };
    answersRef.current = next;
    setAnswers(next);
    // Auto-save for API mode
    if (isApiMode && onSaveAnswer) {
      onSaveAnswer(currentQuestion.id, [optionId]);
    }
  };

  const handleToggleFlag = () => {
    setFlagged((prev) => toggleUnsure(prev, currentQuestion.id));
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleGoToQuestion = (idx: number) => {
    setCurrentIndex(idx);
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitted || isSubmitting || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitted(true);
    setSubmitError("");
    const timeSpent = timeLimitMins * 60 - timeLeft;
    try {
      let saved: void | boolean;
      if (isApiMode)
        saved = await onSubmit(
          Object.entries(answersRef.current).map(([question_id, id]) => ({
            question_id,
            selected_answer_ids: [id],
          })),
          timeSpent
        );
      else saved = await onSubmit(answersRef.current, timeSpent);
      if (saved === false) throw new Error("submit failed");
    } catch {
      setIsSubmitted(false);
      setSubmitError("Không nộp được bài. Câu trả lời vẫn được giữ, hãy bấm Nộp bài để thử lại.");
    } finally {
      submittingRef.current = false;
    }
  }, [timeLeft, timeLimitMins, onSubmit, isSubmitted, isSubmitting, isApiMode]);

  useEffect(() => {
    if (timeLeft === 0 && !autoSubmittedRef.current && !isSubmitted) {
      autoSubmittedRef.current = true;
      void handleSubmit();
    }
  }, [timeLeft, isSubmitted, handleSubmit]);

  if (!currentQuestion)
    return (
      <div role="alert" className="p-6">
        Bài kiểm tra chưa có câu hỏi.
        {onBack && (
          <button onClick={onBack} className="ml-2 underline">
            Quay lại
          </button>
        )}
      </div>
    );

  const selectedAnswer = answers[currentQuestion.id];

  return (
    // Dưới `lg` xếp DỌC (câu hỏi rồi bản đồ câu hỏi); cột `w-72` cố định ở 390px làm cột câu hỏi co còn
    // ~10px và nút Tiếp theo/Nộp bài không bấm được (QA3 Q3).
    <div className="flex-1 flex flex-col gap-4 p-3 sm:p-5 lg:flex-row lg:gap-5 lg:overflow-hidden">
      {/* Mobile: thanh thời gian + tiến độ gọn, dính đầu vùng nội dung. Desktop dùng thẻ Thời gian ở cột phải. */}
      <div
        data-testid="quiz-compact-bar"
        className="sticky top-0 z-20 -mx-3 -mt-3 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-2 backdrop-blur sm:-mx-5 sm:-mt-5 sm:px-5 lg:hidden"
      >
        <span
          className={cn(
            "flex items-center gap-1.5 text-base font-bold tabular-nums",
            timeLeft <= 60 ? "text-red-500" : "text-foreground"
          )}
        >
          <Clock className="h-4 w-4 text-orange-500" aria-hidden="true" />
          {formatTime(timeLeft)}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
          {currentIndex + 1}/{totalQuestions}
        </span>
      </div>

      {/* Left: Question Area */}
      <div className="flex-1 min-w-0 flex flex-col bg-card rounded-2xl shadow-sm overflow-hidden">
        {/* Quiz Header */}
        <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-blue-600 font-medium dark:text-blue-400">
              Câu {currentIndex + 1} / {totalQuestions}
            </span>
            <span className="text-sm text-muted-foreground">
              Đã trả lời: {answeredCount}/{totalQuestions}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <p className="text-lg text-foreground leading-relaxed mb-6">
            {renderQuestionText(currentQuestion.text, currentQuestion.codeSnippets)}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              // In API mode, compare with option.id; in demo mode, compare with option.key
              const isSelected = isApiMode
                ? selectedAnswer === option.id
                : selectedAnswer === option.key;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectAnswer(option.id, option.key)}
                  disabled={isSubmitted || isSubmitting}
                  className={cn(
                    "w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left",
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                      : "border-border hover:border-input hover:bg-muted/50",
                    isSubmitted && "cursor-not-allowed opacity-70"
                  )}
                >
                  <span
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                      isSelected ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {option.key}
                  </span>
                  <span className="flex-1 text-foreground pt-1">{option.text}</span>
                  {isSelected && <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium transition-colors",
                currentIndex === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-foreground hover:bg-muted/50"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Câu trước
            </button>
            <UnsureToggle
              isUnsure={flagged.has(currentQuestion.id)}
              onToggle={handleToggleFlag}
              compact
            />
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === totalQuestions - 1}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
              currentIndex === totalQuestions - 1
                ? "bg-muted text-gray-300 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            Tiếp theo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right (desktop) / dưới câu hỏi (mobile): Timer & Question Map */}
      <div className="w-full lg:w-72 flex flex-col gap-4">
        {/* Timer Card — mobile đã có thanh gọn ở trên */}
        <div className="hidden lg:block bg-card rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center dark:bg-orange-500/10">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Thời gian
              </p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  timeLeft <= 60 ? "text-red-500" : "text-foreground"
                )}
              >
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
        </div>

        {/* Question Map Card */}
        <div className="bg-card rounded-2xl shadow-sm p-5 flex-1 flex flex-col">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Bản đồ câu hỏi
          </h3>

          {/* Question Grid */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIndex;
              const isFlagged = flagged.has(q.id);

              return (
                <button
                  key={q.id}
                  onClick={() => handleGoToQuestion(idx)}
                  className={cn(
                    "w-10 h-10 rounded-lg text-sm font-semibold transition-all relative",
                    isCurrent
                      ? "bg-blue-500 text-white ring-2 ring-blue-300"
                      : isAnswered
                        ? "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-500/15 dark:text-blue-400"
                        : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                  )}
                >
                  {idx + 1}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500" />
              <span>Hiện tại</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-500/15" />
              <span>Đã trả lời</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-muted" />
              <span>Chưa trả lời</span>
            </div>
          </div>

          {/* Nhắc soi lại các câu tự thấy chưa chắc — cờ chỉ sống ở client */}
          <UnsureSummary count={countUnsure(flagged)} />

          {/* Submit Button */}
          {submitError && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {submitError}
            </p>
          )}
          <button
            onClick={() => void handleSubmit()}
            disabled={isSubmitted || isSubmitting}
            className={cn(
              "mt-auto w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors",
              isSubmitted || isSubmitting
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-800"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang nộp...
              </>
            ) : (
              <>
                Nộp bài
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
