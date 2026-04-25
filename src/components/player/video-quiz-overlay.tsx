"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VideoQuiz } from "@/types/course-player";

interface VideoQuizOverlayProps {
  quiz: VideoQuiz;
  onSubmit: (quizId: string, answerId: string) => void;
  onSkip: (quizId: string) => void;
  timeLimit?: number; // seconds, default 15
}

export function VideoQuizOverlay({
  quiz,
  onSubmit,
  onSkip,
  timeLimit = 15,
}: VideoQuizOverlayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onSkip(quiz.id);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quiz.id, onSkip]);

  const handleSubmit = useCallback(() => {
    if (selectedAnswer) {
      onSubmit(quiz.id, selectedAnswer);
    }
  }, [quiz.id, selectedAnswer, onSubmit]);

  const handleSkip = useCallback(() => {
    onSkip(quiz.id);
  }, [quiz.id, onSkip]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:00`;
  };

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded">
            QUESTION
          </span>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Question */}
        <div className="px-6 pb-4">
          <p className="text-gray-900 font-medium leading-relaxed">{quiz.question}</p>
        </div>

        {/* Options */}
        <div className="px-6 space-y-3">
          {quiz.options.map((option) => (
            <button
              key={option.key}
              onClick={() => setSelectedAnswer(option.key)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
                selectedAnswer === option.key
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  selectedAnswer === option.key
                    ? "border-primary-500"
                    : "border-gray-300"
                )}
              >
                {selectedAnswer === option.key && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm",
                  selectedAnswer === option.key
                    ? "text-primary-700 font-medium"
                    : "text-gray-700"
                )}
              >
                {option.text}
              </span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className={cn(
              "flex-1 py-3 rounded-xl font-medium text-sm transition-colors",
              selectedAnswer
                ? "bg-primary-600 text-white hover:bg-primary-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            Xác nhận
          </button>
          <button
            onClick={handleSkip}
            className="px-6 py-3 rounded-xl font-medium text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Bỏ qua
          </button>
        </div>
      </div>
    </div>
  );
}
