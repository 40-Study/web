"use client";

/**
 * Score summary card (circular indicator + stats grid + badges + actions)
 * and the question map card shown side-by-side at the top of the quiz result.
 */

import { CheckCircle2, XCircle, Clock, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    QuizResultProps,
    QuestionStatus,
    computeStats,
    formatTime,
    getQuestionStatus,
} from "./quiz-result-types";

// ---------------------------------------------------------------------------
// Circular SVG score indicator
// ---------------------------------------------------------------------------
function ScoreCircle({ percent }: { percent: number }) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    const color = percent >= 70 ? "#22c55e" : "#ef4444";

    return (
        <div className="relative flex items-center justify-center w-36 h-36">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" width="144" height="144">
                {/* Track */}
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
                {/* Progress */}
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
            </svg>
            <div className="relative flex flex-col items-center leading-tight">
                <span className="text-3xl font-bold text-gray-800">{percent}%</span>
                <span className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase">
                    Score
                </span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Stat item inside the grid
// ---------------------------------------------------------------------------
function StatItem({
    label,
    value,
    icon,
    color,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <div className="flex flex-col items-center gap-1">
            <div className={cn("text-2xl font-bold", color)}>{value}</div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                {icon}
                {label}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Question map card
// ---------------------------------------------------------------------------
const STATUS_DOT: Record<QuestionStatus, string> = {
    correct: "bg-green-500",
    incorrect: "bg-red-500",
    skipped: "bg-gray-300",
};

const STATUS_TEXT: Record<QuestionStatus, string> = {
    correct: "bg-green-100 text-green-700 border border-green-200",
    incorrect: "bg-red-100 text-red-700 border border-red-200",
    skipped: "bg-gray-100 text-gray-500 border border-gray-200",
};

function QuestionMap({
    questions,
    answers,
    activeIndex,
    onSelect,
}: {
    questions: QuizResultProps["quiz"]["questions"];
    answers: QuizResultProps["answers"];
    activeIndex: number;
    onSelect: (i: number) => void;
}) {
    return (
        <div className="rounded-2xl bg-white shadow-sm p-5 flex flex-col gap-4 min-w-[220px]">
            <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                Bản đồ câu hỏi
            </h3>

            <div className="grid grid-cols-4 gap-2">
                {questions.map((q, i) => {
                    const status = getQuestionStatus(q, answers);
                    return (
                        <button
                            key={q.id}
                            onClick={() => onSelect(i)}
                            className={cn(
                                "w-10 h-10 rounded-lg text-xs font-semibold transition-all",
                                STATUS_TEXT[status],
                                activeIndex === i && "ring-2 ring-offset-1 ring-blue-400"
                            )}
                        >
                            {i + 1}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 font-medium mt-auto">
                {(["correct", "incorrect", "skipped"] as QuestionStatus[]).map((s) => (
                    <span key={s} className="flex items-center gap-1 capitalize">
                        <span className={cn("w-2.5 h-2.5 rounded-full", STATUS_DOT[s])} />
                        {s === "correct" ? "Đúng" : s === "incorrect" ? "Sai" : "Bỏ qua"}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Exported composite component
// ---------------------------------------------------------------------------
interface ScoreCardSectionProps {
    quiz: QuizResultProps["quiz"];
    answers: QuizResultProps["answers"];
    timeSpent: number;
    onRetry: () => void;
    onReview: () => void;
    activeIndex: number;
    onSelectQuestion: (i: number) => void;
}

export function ScoreCardSection({
    quiz,
    answers,
    timeSpent,
    onRetry,
    onReview,
    activeIndex,
    onSelectQuestion,
}: ScoreCardSectionProps) {
    const { correct, incorrect, skipped, scorePercent, passed } = computeStats(quiz, answers);

    return (
        <div className="flex flex-col md:flex-row gap-4">
            {/* Summary card */}
            <div className="flex-1 rounded-2xl bg-white shadow-sm p-6 flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <ScoreCircle percent={scorePercent} />

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 flex-1">
                        <StatItem
                            label="Correct"
                            value={correct}
                            icon={<CheckCircle2 className="w-3 h-3" />}
                            color="text-green-500"
                        />
                        <StatItem
                            label="Incorrect"
                            value={incorrect}
                            icon={<XCircle className="w-3 h-3" />}
                            color="text-red-500"
                        />
                        <StatItem
                            label="Skipped"
                            value={skipped}
                            icon={<SkipForward className="w-3 h-3" />}
                            color="text-gray-400"
                        />
                        <StatItem
                            label="Time"
                            value={formatTime(timeSpent)}
                            icon={<Clock className="w-3 h-3" />}
                            color="text-gray-700"
                        />
                    </div>
                </div>

                {/* Badge */}
                <div className="flex items-center gap-3">
                    <span
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase",
                            passed
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                        )}
                    >
                        {passed ? "Passed" : "Failed"}
                    </span>
                    <span className="text-sm text-gray-400">
                        {passed ? "Chúc mừng! Bạn đã vượt qua bài kiểm tra." : "Cần ôn tập thêm và thử lại."}
                    </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={onReview}
                        className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Review Answers
                    </button>
                    <button
                        onClick={onRetry}
                        className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Retry Quiz
                    </button>
                </div>
            </div>

            {/* Question map */}
            <QuestionMap
                questions={quiz.questions}
                answers={answers}
                activeIndex={activeIndex}
                onSelect={onSelectQuestion}
            />
        </div>
    );
}
