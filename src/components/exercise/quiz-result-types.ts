/**
 * Shared types and pure helpers for the quiz result UI.
 */

export interface QuizQuestion {
    id: string;
    question: string;
    options: Array<{ label: string; text: string }>;
    correctAnswer: string;
    explanation: string;
}

export interface Quiz {
    id: string;
    title: string;
    questions: QuizQuestion[];
}

export interface QuizResultProps {
    quiz: Quiz;
    /** Map of questionId → selected option label (e.g. "A", "B", …) */
    answers: Record<string, string>;
    /** Total time spent in seconds */
    timeSpent: number;
    onRetry: () => void;
}

export type QuestionStatus = "correct" | "incorrect" | "skipped";

/** Derive per-question status from answers */
export function getQuestionStatus(
    question: QuizQuestion,
    answers: Record<string, string>
): QuestionStatus {
    const answer = answers[question.id];
    if (!answer) return "skipped";
    return answer === question.correctAnswer ? "correct" : "incorrect";
}

/** Compute overall quiz stats */
export function computeStats(quiz: Quiz, answers: Record<string, string>) {
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    for (const q of quiz.questions) {
        const status = getQuestionStatus(q, answers);
        if (status === "correct") correct++;
        else if (status === "incorrect") incorrect++;
        else skipped++;
    }

    const total = quiz.questions.length;
    const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = scorePercent >= 70;

    return { correct, incorrect, skipped, total, scorePercent, passed };
}

/** Format seconds to MM:SS */
export function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}
