"use client";

/**
 * Renders the full detail view for a single quiz question:
 * - Header with status badge
 * - Question text
 * - 4 answer options with correct/incorrect highlighting
 * - Explanation box
 * - Bottom navigation (prev / counter / next-incorrect)
 */

import { CheckCircle2, XCircle, Lightbulb, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuizQuestion, QuestionStatus, getQuestionStatus } from "./quiz-result-types";

// ---------------------------------------------------------------------------
// Option row
// ---------------------------------------------------------------------------
interface OptionRowProps {
    label: string;
    text: string;
    isCorrect: boolean;
    isSelected: boolean;
}

function OptionRow({ label, text, isCorrect, isSelected }: OptionRowProps) {
    const isWrongPick = isSelected && !isCorrect;

    return (
        <div
            className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                isCorrect
                    ? "border-green-400 bg-green-50"
                    : isWrongPick
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-white"
            )}
        >
            {/* Label bubble */}
            <span
                className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5",
                    isCorrect
                        ? "bg-green-500 text-white"
                        : isWrongPick
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-600"
                )}
            >
                {label}
            </span>

            {/* Text */}
            <span className={cn("flex-1", isCorrect ? "text-green-800" : isWrongPick ? "text-red-800" : "text-gray-700")}>
                {text}
            </span>

            {/* Trailing badges + icon */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {isSelected && (
                    <span
                        className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                            isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}
                    >
                        Your choice
                    </span>
                )}
                {isCorrect && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">
                        Correct
                    </span>
                )}
                {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : isWrongPick ? (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                ) : null}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Explanation box
// ---------------------------------------------------------------------------
function ExplanationBox({ text }: { text: string }) {
    return (
        <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
                    Giải thích
                </p>
                <p className="text-sm text-amber-900 leading-relaxed">{text}</p>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
interface QuizResultQuestionDetailProps {
    question: QuizQuestion;
    answers: Record<string, string>;
    /** 0-based index of this question in the full list */
    index: number;
    total: number;
    /** 0-based index of next incorrect question; -1 if none */
    nextIncorrectIndex: number;
    onPrev: () => void;
    onNext: () => void;
    onGoTo: (index: number) => void;
}

export function QuizResultQuestionDetail({
    question,
    answers,
    index,
    total,
    nextIncorrectIndex,
    onPrev,
    onNext,
    onGoTo,
}: QuizResultQuestionDetailProps) {
    const status: QuestionStatus = getQuestionStatus(question, answers);
    const selectedAnswer = answers[question.id];

    const statusLabel = status === "correct" ? "Correct Answer" : status === "incorrect" ? "Incorrect Answer" : "Skipped";
    const statusStyle =
        status === "correct"
            ? "bg-green-100 text-green-700"
            : status === "incorrect"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-500";

    return (
        <div className="rounded-2xl bg-white shadow-sm p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex-shrink-0">
                    {index + 1}
                </span>
                <span className="text-sm font-semibold text-gray-600">Question Details</span>
                <span className={cn("ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide", statusStyle)}>
                    {statusLabel}
                </span>
            </div>

            {/* Question text */}
            <p className="text-gray-800 font-medium leading-relaxed">{question.question}</p>

            {/* Options */}
            <div className="flex flex-col gap-2">
                {question.options.map((opt) => (
                    <OptionRow
                        key={opt.label}
                        label={opt.label}
                        text={opt.text}
                        isCorrect={opt.label === question.correctAnswer}
                        isSelected={opt.label === selectedAnswer}
                    />
                ))}
            </div>

            {/* Explanation */}
            <ExplanationBox text={question.explanation} />

            {/* Bottom navigation */}
            <div className="flex items-center justify-between pt-1">
                <button
                    onClick={onPrev}
                    disabled={index === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Trước
                </button>

                <span className="text-sm text-gray-500 font-medium">
                    Câu {index + 1} / {total}
                </span>

                <div className="flex items-center gap-2">
                    {nextIncorrectIndex !== -1 && (
                        <button
                            onClick={() => onGoTo(nextIncorrectIndex)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                            Next Incorrect
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onNext}
                        disabled={index === total - 1}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Tiếp
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
