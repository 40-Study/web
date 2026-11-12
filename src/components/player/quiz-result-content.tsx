"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle, XCircle, Clock, Eye, RotateCcw, ChevronLeft,
  ChevronRight, Lightbulb, SkipForward
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QuizResultAnswer {
  id: string;
  question_id: string;
  question_text: string;
  question_type: string;
  options: {
    id: string;
    key: string;
    text: string;
    is_correct: boolean;
  }[];
  selected_answer_ids: string[];
  correct_answer_ids: string[];
  is_correct: boolean;
  points_earned: number;
  explanation?: string;
}

export interface QuizResultData {
  quiz_id: string;
  attempt_id: string;
  title: string;
  score: number; // percentage 0-100
  total_points: number;
  earned_points: number;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  total_questions: number;
  time_spent_seconds: number;
  is_passed: boolean;
  pass_percentage: number;
  answers: QuizResultAnswer[];
}

interface QuizResultContentProps {
  result: QuizResultData;
  onRetry?: () => void;
  onBack?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function renderExplanationText(text: string) {
  // Simple code highlight: wrap `code` in styled spans
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={idx} className="px-1 py-0.5 bg-amber-200 text-amber-800 rounded text-sm font-mono dark:text-amber-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

// ─── Score Circle Component ──────────────────────────────────────────────────

function ScoreCircle({ score, isPassed }: { score: number; isPassed: boolean }) {
  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={isPassed ? "#22c55e" : "#ef4444"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{Math.round(score)}%</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Điểm</span>
      </div>
      {/* Pass/Fail badge */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1",
          isPassed
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white"
        )}>
          {isPassed ? (
            <>
              <CheckCircle className="w-3 h-3" />
              Đạt
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" />
              Không đạt
            </>
          )}
        </span>
      </div>
    </div>
  );
}

// ─── Stats Card Component ────────────────────────────────────────────────────

function StatsCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: typeof CheckCircle;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("w-4 h-4", color)} />
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

// ─── Question Review Component ───────────────────────────────────────────────

function QuestionReview({
  answer,
  questionNumber
}: {
  answer: QuizResultAnswer;
  questionNumber: number;
}) {
  const selectedIds = new Set(answer.selected_answer_ids);
  const correctIds = new Set(answer.correct_answer_ids);
  const isSkipped = answer.selected_answer_ids.length === 0;

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
            answer.is_correct
              ? "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400"
              : isSkipped
              ? "bg-muted text-muted-foreground"
              : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
          )}>
            {questionNumber}
          </span>
          <span className="font-semibold text-foreground">Chi tiết câu hỏi</span>
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase",
          answer.is_correct
            ? "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400"
            : isSkipped
            ? "bg-muted text-muted-foreground"
            : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
        )}>
          {answer.is_correct ? "Đúng" : isSkipped ? "Bỏ qua" : "Sai"}
        </span>
      </div>

      {/* Question */}
      <div className="px-6 py-5">
        <p className="text-foreground leading-relaxed mb-5">{answer.question_text}</p>

        {/* Options */}
        <div className="space-y-3">
          {answer.options.map((option) => {
            const isSelected = selectedIds.has(option.id);
            const isCorrect = correctIds.has(option.id);
            const isWrongSelection = isSelected && !isCorrect;

            return (
              <div
                key={option.id}
                className={cn(
                  "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                  isWrongSelection
                    ? "border-red-400 bg-red-50 dark:bg-red-500/10"
                    : isCorrect
                    ? "border-green-400 bg-green-50 dark:bg-green-500/10"
                    : "border-border bg-muted/50"
                )}
              >
                <span className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                  isWrongSelection
                    ? "bg-red-500 text-white"
                    : isCorrect
                    ? "bg-green-500 text-white"
                    : "bg-muted-foreground/20 text-muted-foreground"
                )}>
                  {option.key}
                </span>
                <span className={cn(
                  "flex-1",
                  isWrongSelection ? "text-red-700 dark:text-red-300" : isCorrect ? "text-green-700 dark:text-green-300" : "text-foreground"
                )}>
                  {option.text}
                </span>

                {/* Status icon */}
                {isWrongSelection && (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                )}
                {isCorrect && (
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                )}

                {/* Tags */}
                {isSelected && !isCorrect && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded uppercase">
                    Đã chọn
                  </span>
                )}
                {isCorrect && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded uppercase">
                    Đáp án đúng
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        {answer.explanation && (
          <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl dark:bg-amber-500/10 dark:border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-700 font-medium mb-2 dark:text-amber-300">
              <Lightbulb className="w-4 h-4" />
              <span>Giải thích</span>
            </div>
            <p className="text-amber-800 text-sm leading-relaxed dark:text-amber-300">
              {renderExplanationText(answer.explanation)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Question Map Component ──────────────────────────────────────────────────

function QuestionMap({
  answers,
  currentIndex,
  onSelect
}: {
  answers: QuizResultAnswer[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="bg-card rounded-2xl shadow-sm p-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Bản đồ câu hỏi
      </h3>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {answers.map((answer, idx) => {
          const isSkipped = answer.selected_answer_ids.length === 0;
          const isCurrent = idx === currentIndex;

          return (
            <button
              key={answer.id}
              onClick={() => onSelect(idx)}
              className={cn(
                "w-10 h-10 rounded-lg text-sm font-semibold transition-all",
                isCurrent && "ring-2 ring-blue-400",
                answer.is_correct
                  ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/15 dark:text-green-300"
                  : isSkipped
                  ? "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                  : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/15 dark:text-red-300"
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span>Đúng</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span>Sai</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-muted-foreground/30" />
          <span>Bỏ qua</span>
        </div>
      </div>
    </div>
  );
}

// ─── Review Section Component ─────────────────────────────────────────────────

function ReviewSection({
  result,
  currentQuestionIndex,
  onSelectQuestion,
  onPrev,
  onNext,
  onNextIncorrect,
  incorrectIndices,
}: {
  result: QuizResultData;
  currentQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onNextIncorrect: () => void;
  incorrectIndices: number[];
}) {
  const currentAnswer = result.answers[currentQuestionIndex];

  return (
    <div className="flex gap-5">
      {/* Left: Question Review */}
      <div className="flex-1 flex flex-col">
        {/* Question content */}
        <QuestionReview
          answer={currentAnswer}
          questionNumber={currentQuestionIndex + 1}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
          <button
            onClick={onPrev}
            disabled={currentQuestionIndex === 0}
            className={cn(
              "p-2 rounded-lg transition-colors",
              currentQuestionIndex === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm text-muted-foreground">
            Câu hỏi {currentQuestionIndex + 1} / {result.total_questions}
          </span>

          <div className="flex items-center gap-2">
            {incorrectIndices.length > 0 && (
              <button
                onClick={onNextIncorrect}
                className="flex items-center gap-1 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-blue-400 dark:hover:bg-blue-500/10"
              >
                Câu sai tiếp theo
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onNext}
              disabled={currentQuestionIndex === result.answers.length - 1}
              className={cn(
                "p-2 rounded-lg transition-colors",
                currentQuestionIndex === result.answers.length - 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right: Question Map */}
      <div className="w-64 shrink-0">
        <QuestionMap
          answers={result.answers}
          currentIndex={currentQuestionIndex}
          onSelect={onSelectQuestion}
        />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function QuizResultContent({ result, onRetry, onBack }: QuizResultContentProps) {
  const [showReview, setShowReview] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const incorrectIndices = useMemo(() =>
    result.answers
      .map((a, idx) => ({ idx, isCorrect: a.is_correct }))
      .filter(item => !item.isCorrect)
      .map(item => item.idx),
    [result.answers]
  );

  const handleNextIncorrect = () => {
    const nextIncorrect = incorrectIndices.find(idx => idx > currentQuestionIndex);
    if (nextIncorrect !== undefined) {
      setCurrentQuestionIndex(nextIncorrect);
    } else if (incorrectIndices.length > 0) {
      setCurrentQuestionIndex(incorrectIndices[0]);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < result.answers.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const toggleReview = () => {
    setShowReview(prev => !prev);
    if (!showReview) {
      setCurrentQuestionIndex(0);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Kết quả kiểm tra: {result.title}
        </h1>

        {/* Summary Card */}
        <div className="bg-card rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Score Circle */}
            <ScoreCircle score={result.score} isPassed={result.is_passed} />

            {/* Stats + Actions */}
            <div className="flex-1 w-full">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <StatsCard
                  icon={CheckCircle}
                  label="Đúng"
                  value={result.correct_count}
                  color="text-green-500"
                />
                <StatsCard
                  icon={XCircle}
                  label="Sai"
                  value={result.incorrect_count}
                  color="text-red-500"
                />
                <StatsCard
                  icon={SkipForward}
                  label="Bỏ qua"
                  value={result.skipped_count}
                  color="text-muted-foreground"
                />
                <StatsCard
                  icon={Clock}
                  label="Thời gian"
                  value={formatTime(result.time_spent_seconds)}
                  color="text-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={toggleReview}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-colors",
                    showReview
                      ? "bg-muted-foreground/20 text-foreground hover:bg-muted-foreground/30"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  <Eye className="w-4 h-4" />
                  {showReview ? "Ẩn chi tiết" : "Xem chi tiết"}
                </button>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border border-border text-foreground rounded-xl font-medium hover:bg-muted/50 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Làm lại
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-card rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Tổng quan</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tổng số câu hỏi</span>
              <span className="font-medium">{result.total_questions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Điểm đạt</span>
              <span className="font-medium">{result.earned_points}/{result.total_points}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Điểm chuẩn</span>
              <span className="font-medium">{result.pass_percentage}%</span>
            </div>
          </div>
        </div>

        {/* Review Section with slide animation */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-500 ease-out",
            showReview ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className={cn(
            "transform transition-transform duration-500 ease-out",
            showReview ? "translate-y-0" : "-translate-y-8"
          )}>
            {/* Review Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-muted-foreground/20" />
              <h2 className="text-lg font-semibold text-foreground">Chi tiết câu trả lời</h2>
              <div className="h-px flex-1 bg-muted-foreground/20" />
            </div>

            {/* Review Content */}
            <ReviewSection
              result={result}
              currentQuestionIndex={currentQuestionIndex}
              onSelectQuestion={setCurrentQuestionIndex}
              onPrev={handlePrev}
              onNext={handleNext}
              onNextIncorrect={handleNextIncorrect}
              incorrectIndices={incorrectIndices}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
