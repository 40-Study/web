"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  passingScore?: number; // percentage, default 70
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
}

interface QuizWidgetProps {
  quiz: Quiz;
  onSubmit: (answers: QuizAnswer[], score: number) => void;
  onComplete?: () => void;
  className?: string;
}

export function QuizWidget({
  quiz,
  onSubmit,
  onComplete,
  className,
}: QuizWidgetProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = quiz.questions[currentQuestion];
  const selectedAnswer = answers[question.id];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const passingScore = quiz.passingScore ?? 70;

  const handleSelectAnswer = (optionId: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    }
  };

  const handleSubmit = () => {
    const quizAnswers: QuizAnswer[] = Object.entries(answers).map(
      ([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      })
    );

    // Calculate score
    const correctCount = quiz.questions.filter(
      (q) => answers[q.id] === q.correctOptionId
    ).length;
    const score = (correctCount / totalQuestions) * 100;

    setIsSubmitted(true);
    setShowExplanation(true);
    onSubmit(quizAnswers, score);
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setIsSubmitted(false);
    setShowExplanation(false);
  };

  // Calculate score for display after submission
  const correctCount = isSubmitted
    ? quiz.questions.filter((q) => answers[q.id] === q.correctOptionId).length
    : 0;
  const score = (correctCount / totalQuestions) * 100;
  const passed = score >= passingScore;

  return (
    <Card className={cn("p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold">{quiz.title}</h2>
          <span className="text-sm text-muted-foreground">
            Cau hoi {currentQuestion + 1}/{totalQuestions}
          </span>
        </div>
        <ProgressBar
          value={((currentQuestion + 1) / totalQuestions) * 100}
          size="sm"
          className="w-24"
        />
      </div>

      {/* Results (shown after submission) */}
      {isSubmitted && (
        <div
          className={cn(
            "mb-6 p-4 rounded-lg text-center",
            passed
              ? "bg-green-100 dark:bg-green-900/30"
              : "bg-red-100 dark:bg-red-900/30"
          )}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            {passed ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <span
              className={cn(
                "text-lg font-semibold",
                passed ? "text-green-700" : "text-red-700"
              )}
            >
              {passed ? "Chuc mung! Ban da dat" : "Chua dat"}
            </span>
          </div>
          <p className="text-2xl font-bold">
            {correctCount}/{totalQuestions} ({Math.round(score)}%)
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Diem chuan: {passingScore}%
          </p>
        </div>
      )}

      {/* Question */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">{question.text}</h3>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.id === question.correctOptionId;
            const showCorrectness = isSubmitted && showExplanation;

            return (
              <button
                key={option.id}
                onClick={() => handleSelectAnswer(option.id)}
                disabled={isSubmitted}
                className={cn(
                  "w-full p-4 text-left rounded-lg border-2 transition-all",
                  !isSubmitted && isSelected
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30"
                    : "border-muted hover:border-muted-foreground/50",
                  showCorrectness &&
                    isCorrect &&
                    "border-green-500 bg-green-50 dark:bg-green-900/30",
                  showCorrectness &&
                    isSelected &&
                    !isCorrect &&
                    "border-red-500 bg-red-50 dark:bg-red-900/30",
                  isSubmitted && "cursor-default"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border",
                      isSelected && !isSubmitted
                        ? "bg-primary-500 text-white border-primary-500"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{option.text}</span>
                  {showCorrectness && isCorrect && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {showCorrectness && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && question.explanation && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Giai thich:</p>
            <p className="text-sm text-muted-foreground">
              {question.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={handlePrevQuestion}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Truoc
        </Button>

        <div className="flex gap-2">
          {isSubmitted && (
            <Button variant="outline" onClick={handleRetry}>
              Lam lai
            </Button>
          )}
          {isSubmitted && passed && onComplete && (
            <Button onClick={onComplete}>Tiep tuc</Button>
          )}
        </div>

        {currentQuestion < totalQuestions - 1 ? (
          <Button onClick={handleNextQuestion} disabled={!selectedAnswer}>
            Tiep
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : !isSubmitted ? (
          <Button
            onClick={handleSubmit}
            disabled={answeredCount < totalQuestions}
          >
            Nop bai
          </Button>
        ) : (
          <div className="w-20" /> // Spacer
        )}
      </div>

      {/* Question dots indicator */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {quiz.questions.map((q, idx) => {
          const isAnswered = !!answers[q.id];
          const isCurrent = idx === currentQuestion;
          const isCorrectAnswer =
            isSubmitted && answers[q.id] === q.correctOptionId;
          const isWrongAnswer =
            isSubmitted && answers[q.id] && answers[q.id] !== q.correctOptionId;

          return (
            <button
              key={q.id}
              onClick={() => {
                setCurrentQuestion(idx);
                setShowExplanation(isSubmitted);
              }}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                isCurrent && "w-6",
                !isSubmitted && isAnswered && "bg-primary-500",
                !isSubmitted && !isAnswered && "bg-muted-foreground/30",
                isCurrent && !isSubmitted && "bg-primary-600",
                isCorrectAnswer && "bg-green-500",
                isWrongAnswer && "bg-red-500"
              )}
              aria-label={`Cau hoi ${idx + 1}`}
            />
          );
        })}
      </div>
    </Card>
  );
}
