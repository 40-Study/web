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
        <code key={idx} className="px-1 py-0.5 bg-amber-200 text-amber-800 rounded text-sm font-mono">
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
        <span className="text-3xl font-bold text-gray-900">{Math.round(score)}%</span>
        <span className="text-xs text-gray-500 uppercase tracking-wider">Điểm</span>
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
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("w-4 h-4", color)} />
        <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
            answer.is_correct
              ? "bg-green-100 text-green-600"
              : isSkipped
              ? "bg-gray-100 text-gray-500"
              : "bg-red-100 text-red-600"
          )}>
            {questionNumber}
          </span>
          <span className="font-semibold text-gray-800">Chi tiết câu hỏi</span>
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase",
          answer.is_correct
            ? "bg-green-100 text-green-600"
            : isSkipped
            ? "bg-gray-100 text-gray-500"
            : "bg-red-100 text-red-600"
        )}>
          {answer.is_correct ? "Đúng" : isSkipped ? "Bỏ qua" : "Sai"}
        </span>
      </div>

      {/* Question */}
      <div className="px-6 py-5">
        <p className="text-gray-800 leading-relaxed mb-5">{answer.question_text}</p>

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
                    ? "border-red-400 bg-red-50"
                    : isCorrect
                    ? "border-green-400 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                )}
              >
                <span className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                  isWrongSelection
                    ? "bg-red-500 text-white"
                    : isCorrect
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                )}>
                  {option.key}
                </span>
                <span className={cn(
                  "flex-1",
                  isWrongSelection ? "text-red-700" : isCorrect ? "text-green-700" : "text-gray-700"
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
          <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
              <Lightbulb className="w-4 h-4" />
              <span>Giải thích</span>
            </div>
            <p className="text-amber-800 text-sm leading-relaxed">
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
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
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
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : isSkipped
                  ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span>Đúng</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span>Sai</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-300" />
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
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={onPrev}
            disabled={currentQuestionIndex === 0}
            className={cn(
              "p-2 rounded-lg transition-colors",
              currentQuestionIndex === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm text-gray-500">
            Câu hỏi {currentQuestionIndex + 1} / {result.total_questions}
          </span>

          <div className="flex items-center gap-2">
            {incorrectIndices.length > 0 && (
              <button
                onClick={onNextIncorrect}
                className="flex items-center gap-1 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                  : "text-gray-600 hover:bg-gray-100"
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Kết quả kiểm tra: {result.title}
        </h1>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
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
                  color="text-gray-400"
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
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  <Eye className="w-4 h-4" />
                  {showReview ? "Ẩn chi tiết" : "Xem chi tiết"}
                </button>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
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
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Tổng quan</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tổng số câu hỏi</span>
              <span className="font-medium">{result.total_questions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Điểm đạt</span>
              <span className="font-medium">{result.earned_points}/{result.total_points}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Điểm chuẩn</span>
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
              <div className="h-px flex-1 bg-gray-200" />
              <h2 className="text-lg font-semibold text-gray-800">Chi tiết câu trả lời</h2>
              <div className="h-px flex-1 bg-gray-200" />
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

// ─── Demo Data ───────────────────────────────────────────────────────────────

export const DEMO_QUIZ_RESULT: QuizResultData = {
  quiz_id: "quiz-1",
  attempt_id: "attempt-1",
  title: "React Hooks Fundamentals",
  score: 85,
  total_points: 20,
  earned_points: 17,
  correct_count: 17,
  incorrect_count: 2,
  skipped_count: 1,
  total_questions: 20,
  time_spent_seconds: 905, // 15:05
  is_passed: true,
  pass_percentage: 70,
  answers: [
    {
      id: "a1",
      question_id: "q1",
      question_text: "Hook nao duoc su dung de quan ly state trong functional component?",
      question_type: "single_choice",
      options: [
        { id: "o1", key: "A", text: "useEffect", is_correct: false },
        { id: "o2", key: "B", text: "useState", is_correct: true },
        { id: "o3", key: "C", text: "useContext", is_correct: false },
        { id: "o4", key: "D", text: "useReducer", is_correct: false },
      ],
      selected_answer_ids: ["o2"],
      correct_answer_ids: ["o2"],
      is_correct: true,
      points_earned: 1,
    },
    {
      id: "a2",
      question_id: "q2",
      question_text: "Which hook would you use to store a persistent value that does not trigger a re-render when it is updated?",
      question_type: "single_choice",
      options: [
        { id: "o5", key: "A", text: "useState", is_correct: false },
        { id: "o6", key: "B", text: "useReducer", is_correct: false },
        { id: "o7", key: "C", text: "useRef", is_correct: true },
        { id: "o8", key: "D", text: "useMemo", is_correct: false },
      ],
      selected_answer_ids: ["o6"],
      correct_answer_ids: ["o7"],
      is_correct: false,
      points_earned: 0,
      explanation: "`useRef` returns a mutable ref object whose `.current` property is initialized to the passed argument. The returned object will persist for the full lifetime of the component. Crucially, updating a ref does not trigger a re-render. On the other hand, `useReducer` is used for state management and will trigger a re-render when the state is dispatched.",
    },
    {
      id: "a3",
      question_id: "q3",
      question_text: "Tai sao nen su dung useCallback hook trong React?",
      question_type: "single_choice",
      options: [
        { id: "o9", key: "A", text: "Tranh re-render component con khong can thiet", is_correct: true },
        { id: "o10", key: "B", text: "Dam bao state dong bo", is_correct: false },
        { id: "o11", key: "C", text: "Thuc hien side effects", is_correct: false },
        { id: "o12", key: "D", text: "Thay the useEffect", is_correct: false },
      ],
      selected_answer_ids: ["o9"],
      correct_answer_ids: ["o9"],
      is_correct: true,
      points_earned: 1,
    },
  ],
};
