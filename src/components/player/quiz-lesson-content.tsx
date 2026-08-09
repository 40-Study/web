"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Flag, Clock, Send, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
  onSubmit: (answers: Record<string, string> | Array<{ question_id: string; selected_answer_ids: string[] }>, timeSpentSeconds: number) => void;
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
            className="px-1.5 py-0.5 mx-0.5 bg-blue-100 text-blue-600 rounded font-mono text-base"
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

export function QuizLessonContent({ quiz, apiQuiz, onSubmit, onSaveAnswer, onBack, isSubmitting }: QuizLessonContentProps) {
  const isApiMode = !!apiQuiz;
  const title = apiQuiz?.title || quiz?.title || "Quiz";
  const timeLimitMins = apiQuiz?.time_limit_minutes || quiz?.timeLimitMinutes || 15;
  const questions = normalizeQuestions(quiz, apiQuiz);

  const [currentIndex, setCurrentIndex] = useState(0);
  // For API mode: store answer IDs. For demo mode: store option keys
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answerValue,
    }));
    // Auto-save for API mode
    if (isApiMode && onSaveAnswer) {
      onSaveAnswer(currentQuestion.id, [optionId]);
    }
  };

  const handleToggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
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

  const handleSubmit = useCallback(() => {
    if (isSubmitted || isSubmitting) return;
    setIsSubmitted(true);
    const timeSpent = timeLimitMins * 60 - timeLeft;

    if (isApiMode) {
      // Convert to API format: array of {question_id, selected_answer_ids}
      const apiAnswers = Object.entries(answers).map(([questionId, answerId]) => ({
        question_id: questionId,
        selected_answer_ids: [answerId],
      }));
      onSubmit(apiAnswers, timeSpent);
    } else {
      // Demo format: Record<questionId, optionKey>
      onSubmit(answers, timeSpent);
    }
  }, [answers, timeLeft, timeLimitMins, onSubmit, isSubmitted, isSubmitting, isApiMode]);

  // Auto submit when time runs out — placed after handleSubmit to satisfy TypeScript declaration order
  useEffect(() => {
    if (timeLeft === 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted, handleSubmit]);

  const selectedAnswer = answers[currentQuestion.id];

  return (
    <div className="flex-1 flex gap-5 p-5 overflow-hidden">
      {/* Left: Question Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Quiz Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-blue-600 font-medium">
              Câu {currentIndex + 1} / {totalQuestions}
            </span>
            <span className="text-sm text-gray-500">
              Đã trả lời: {answeredCount}/{totalQuestions}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-lg text-gray-800 leading-relaxed mb-6">
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
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                    isSubmitted && "cursor-not-allowed opacity-70"
                  )}
                >
                  <span
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                      isSelected
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {option.key}
                  </span>
                  <span className="flex-1 text-gray-700 pt-1">{option.text}</span>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium transition-colors",
                currentIndex === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Câu trước
            </button>
            <button
              onClick={handleToggleFlag}
              className={cn(
                "p-2.5 rounded-lg border transition-colors",
                flagged.has(currentQuestion.id)
                  ? "border-orange-300 bg-orange-50 text-orange-500"
                  : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              )}
              title="Đánh dấu câu hỏi"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === totalQuestions - 1}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
              currentIndex === totalQuestions - 1
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            Tiếp theo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Timer & Question Map */}
      <div className="w-72 flex flex-col gap-4">
        {/* Timer Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Thời gian
              </p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  timeLeft <= 60 ? "text-red-500" : "text-gray-900"
                )}
              >
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
        </div>

        {/* Question Map Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex-1 flex flex-col">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
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
                      ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500" />
              <span>Hiện tại</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-100" />
              <span>Đã trả lời</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gray-100" />
              <span>Chưa trả lời</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitted || isSubmitting}
            className={cn(
              "mt-auto w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors",
              isSubmitted || isSubmitting
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
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

// ─── Demo/Mock Data ──────────────────────────────────────────────────────────

export const DEMO_QUIZ: QuizData = {
  id: "quiz-1",
  title: "Kiểm tra: React Hooks Fundamentals",
  timeLimitMinutes: 15,
  questions: [
    {
      id: "q1",
      question: "Hook nao duoc su dung de quan ly state trong functional component?",
      options: [
        { key: "A", text: "useEffect" },
        { key: "B", text: "useState" },
        { key: "C", text: "useContext" },
        { key: "D", text: "useReducer" },
      ],
      correctAnswer: "B",
    },
    {
      id: "q2",
      question: "useEffect duoc goi khi nao?",
      options: [
        { key: "A", text: "Truoc khi component render" },
        { key: "B", text: "Sau khi component render" },
        { key: "C", text: "Chi khi component mount" },
        { key: "D", text: "Chi khi props thay doi" },
      ],
      correctAnswer: "B",
    },
    {
      id: "q3",
      question: "Tai sao nen su dung useCallback hook trong React?",
      codeSnippets: ["useCallback"],
      options: [
        { key: "A", text: "Tranh re-render component con khong can thiet bang cach memoize callback function" },
        { key: "B", text: "Dam bao cac gia tri state luon dong bo voi giao dien nguoi dung ngay lap tuc" },
        { key: "C", text: "De thuc hien cac side effects sau khi component da mount vao DOM" },
        { key: "D", text: "Thay the hoan toan cho logic su dung useEffect trong functional components" },
      ],
      correctAnswer: "A",
    },
    {
      id: "q4",
      question: "useMemo hook duoc su dung de lam gi?",
      codeSnippets: ["useMemo"],
      options: [
        { key: "A", text: "Memoize gia tri tinh toan phuc tap" },
        { key: "B", text: "Memoize callback function" },
        { key: "C", text: "Tao reference den DOM element" },
        { key: "D", text: "Quan ly global state" },
      ],
      correctAnswer: "A",
    },
    {
      id: "q5",
      question: "useRef tra ve gi?",
      codeSnippets: ["useRef"],
      options: [
        { key: "A", text: "Mot gia tri state" },
        { key: "B", text: "Mot mutable ref object voi property current" },
        { key: "C", text: "Mot function de cap nhat state" },
        { key: "D", text: "Mot context value" },
      ],
      correctAnswer: "B",
    },
    {
      id: "q6",
      question: "Dependency array trong useEffect dung de lam gi?",
      codeSnippets: ["useEffect"],
      options: [
        { key: "A", text: "Xac dinh khi nao effect se chay lai" },
        { key: "B", text: "Truyen tham so vao effect function" },
        { key: "C", text: "Dinh nghia cac bien local" },
        { key: "D", text: "Thiet lap gia tri mac dinh" },
      ],
      correctAnswer: "A",
    },
    {
      id: "q7",
      question: "useContext duoc su dung khi nao?",
      codeSnippets: ["useContext"],
      options: [
        { key: "A", text: "Khi can truyen data qua nhieu cap component" },
        { key: "B", text: "Khi can luu tru data vao localStorage" },
        { key: "C", text: "Khi can fetch data tu API" },
        { key: "D", text: "Khi can tao animation" },
      ],
      correctAnswer: "A",
    },
    {
      id: "q8",
      question: "useReducer thich hop su dung khi nao?",
      codeSnippets: ["useReducer"],
      options: [
        { key: "A", text: "Khi state don gian" },
        { key: "B", text: "Khi state phuc tap va co nhieu sub-values" },
        { key: "C", text: "Khi chi can render mot lan" },
        { key: "D", text: "Khi khong can state" },
      ],
      correctAnswer: "B",
    },
    {
      id: "q9",
      question: "Custom hook bat buoc phai bat dau bang gi?",
      options: [
        { key: "A", text: "hook" },
        { key: "B", text: "use" },
        { key: "C", text: "custom" },
        { key: "D", text: "my" },
      ],
      correctAnswer: "B",
    },
    {
      id: "q10",
      question: "Cleanup function trong useEffect chay khi nao?",
      codeSnippets: ["useEffect"],
      options: [
        { key: "A", text: "Truoc moi lan effect chay va khi component unmount" },
        { key: "B", text: "Chi khi component mount" },
        { key: "C", text: "Chi khi props thay doi" },
        { key: "D", text: "Ngay sau khi effect chay" },
      ],
      correctAnswer: "A",
    },
    {
      id: "q11",
      question: "useState co the nhan gia tri khoi tao la gi?",
      codeSnippets: ["useState"],
      options: [
        { key: "A", text: "Chi primitive values" },
        { key: "B", text: "Chi objects" },
        { key: "C", text: "Bat ky gia tri nao hoac mot function tra ve gia tri" },
        { key: "D", text: "Chi arrays" },
      ],
      correctAnswer: "C",
    },
    {
      id: "q12",
      question: "useLayoutEffect khac useEffect o diem nao?",
      codeSnippets: ["useLayoutEffect", "useEffect"],
      options: [
        { key: "A", text: "Chay dong bo sau khi DOM mutations" },
        { key: "B", text: "Chay bat dong bo" },
        { key: "C", text: "Khong can cleanup" },
        { key: "D", text: "Chi chay mot lan" },
      ],
      correctAnswer: "A",
    },
    {
      id: "q13",
      question: "forwardRef duoc su dung de lam gi?",
      codeSnippets: ["forwardRef"],
      options: [
        { key: "A", text: "Truyen ref xuong child component" },
        { key: "B", text: "Tao ref moi" },
        { key: "C", text: "Copy ref" },
        { key: "D", text: "Xoa ref" },
      ],
      correctAnswer: "A",
    },
    {
      id: "q14",
      question: "useImperativeHandle thuong dung voi gi?",
      codeSnippets: ["useImperativeHandle"],
      options: [
        { key: "A", text: "useState" },
        { key: "B", text: "useEffect" },
        { key: "C", text: "forwardRef" },
        { key: "D", text: "useContext" },
      ],
      correctAnswer: "C",
    },
    {
      id: "q15",
      question: "useDebugValue dung de lam gi?",
      codeSnippets: ["useDebugValue"],
      options: [
        { key: "A", text: "Hien thi label cho custom hooks trong React DevTools" },
        { key: "B", text: "Debug production code" },
        { key: "C", text: "Log errors" },
        { key: "D", text: "Trace renders" },
      ],
      correctAnswer: "A",
    },
    {
      id: "q16",
      question: "Khi nao nen su dung useId?",
      codeSnippets: ["useId"],
      options: [
        { key: "A", text: "Tao unique IDs cho accessibility attributes" },
        { key: "B", text: "Tao database IDs" },
        { key: "C", text: "Tao session IDs" },
        { key: "D", text: "Tao API keys" },
      ],
      correctAnswer: "A",
    },
    {
      id: "q17",
      question: "useTransition dung de lam gi?",
      codeSnippets: ["useTransition"],
      options: [
        { key: "A", text: "Tao CSS transitions" },
        { key: "B", text: "Danh dau state updates la non-urgent" },
        { key: "C", text: "Animate components" },
        { key: "D", text: "Navigate giua pages" },
      ],
      correctAnswer: "B",
    },
    {
      id: "q18",
      question: "useDeferredValue tra ve gi?",
      codeSnippets: ["useDeferredValue"],
      options: [
        { key: "A", text: "Mot phien ban deferred cua value" },
        { key: "B", text: "Mot promise" },
        { key: "C", text: "Mot callback" },
        { key: "D", text: "Mot ref" },
      ],
      correctAnswer: "A",
    },
    {
      id: "q19",
      question: "useSyncExternalStore dung de lam gi?",
      codeSnippets: ["useSyncExternalStore"],
      options: [
        { key: "A", text: "Subscribe toi external store" },
        { key: "B", text: "Sync voi server" },
        { key: "C", text: "Backup state" },
        { key: "D", text: "Cache data" },
      ],
      correctAnswer: "A",
    },
    {
      id: "q20",
      question: "Rules of Hooks bao gom nhung gi?",
      options: [
        { key: "A", text: "Chi goi Hooks o top level va trong React functions" },
        { key: "B", text: "Co the goi Hooks trong vong lap" },
        { key: "C", text: "Co the goi Hooks trong conditions" },
        { key: "D", text: "Co the goi Hooks trong nested functions" },
      ],
      correctAnswer: "A",
    },
  ],
};
