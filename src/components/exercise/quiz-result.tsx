"use client";

/**
 * QuizResult — top-level quiz result/review page component.
 *
 * Layout:
 *   1. Score summary card + question map (side-by-side)
 *   2. Question detail list (one card per question, scrollable)
 *
 * State:
 *   - activeIndex: which question detail is highlighted / scrolled to
 *   - reviewMode: whether to show the detail section (toggled by "Review Answers")
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { QuizResultProps, getQuestionStatus } from "./quiz-result-types";
import { ScoreCardSection } from "./quiz-result-score-card";
import { QuizResultQuestionDetail } from "./quiz-result-question-detail";

export function QuizResult({ quiz, answers, timeSpent, onRetry }: QuizResultProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [reviewMode, setReviewMode] = useState(false);

    // Refs for each question detail card so we can scroll to them
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Pre-compute the list of incorrect question indices for "Next Incorrect" nav
    const incorrectIndices = useMemo(
        () =>
            quiz.questions.reduce<number[]>((acc, q, i) => {
                if (getQuestionStatus(q, answers) === "incorrect") acc.push(i);
                return acc;
            }, []),
        [quiz.questions, answers]
    );

    /** Find the next incorrect question after the current activeIndex */
    const nextIncorrectIndex = useMemo(() => {
        const next = incorrectIndices.find((i) => i > activeIndex);
        return next !== undefined ? next : -1;
    }, [incorrectIndices, activeIndex]);

    const scrollToCard = useCallback((index: number) => {
        cardRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    const handleSelectQuestion = useCallback(
        (index: number) => {
            setActiveIndex(index);
            if (!reviewMode) setReviewMode(true);
            // Defer scroll until after render
            setTimeout(() => scrollToCard(index), 50);
        },
        [reviewMode, scrollToCard]
    );

    const handleReviewAnswers = useCallback(() => {
        setReviewMode(true);
        setActiveIndex(0);
        setTimeout(() => scrollToCard(0), 50);
    }, [scrollToCard]);

    const handlePrev = useCallback(() => {
        const next = Math.max(0, activeIndex - 1);
        setActiveIndex(next);
        scrollToCard(next);
    }, [activeIndex, scrollToCard]);

    const handleNext = useCallback(() => {
        const next = Math.min(quiz.questions.length - 1, activeIndex + 1);
        setActiveIndex(next);
        scrollToCard(next);
    }, [activeIndex, quiz.questions.length, scrollToCard]);

    const handleGoTo = useCallback(
        (index: number) => {
            setActiveIndex(index);
            scrollToCard(index);
        },
        [scrollToCard]
    );

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto">
            {/* Quiz title */}
            <h1 className="text-xl font-bold text-gray-800">{quiz.title}</h1>

            {/* Top section: score card + question map */}
            <ScoreCardSection
                quiz={quiz}
                answers={answers}
                timeSpent={timeSpent}
                onRetry={onRetry}
                onReview={handleReviewAnswers}
                activeIndex={activeIndex}
                onSelectQuestion={handleSelectQuestion}
            />

            {/* Question detail list — shown after "Review Answers" is clicked */}
            {reviewMode && (
                <div className="flex flex-col gap-4">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                        Chi tiết câu trả lời
                    </h2>

                    {quiz.questions.map((question, i) => (
                        <div
                            key={question.id}
                            ref={(el) => {
                                cardRefs.current[i] = el;
                            }}
                            // Subtle ring to indicate the active/focused card
                            className={
                                activeIndex === i
                                    ? "ring-2 ring-blue-300 ring-offset-2 rounded-2xl"
                                    : undefined
                            }
                            onClick={() => setActiveIndex(i)}
                        >
                            <QuizResultQuestionDetail
                                question={question}
                                answers={answers}
                                index={i}
                                total={quiz.questions.length}
                                nextIncorrectIndex={nextIncorrectIndex}
                                onPrev={handlePrev}
                                onNext={handleNext}
                                onGoTo={handleGoTo}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export type { QuizResultProps } from "./quiz-result-types";
