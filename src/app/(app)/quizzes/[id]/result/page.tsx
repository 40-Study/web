"use client";

/**
 * Kết quả một lần làm bài quiz độc lập (contract §6).
 *
 * Đọc `attempt` từ query string (`?attempt=<attemptId>`) vì trang quiz điều
 * hướng sang đây ngay sau khi nộp — không dựng lại đúng/sai ở client, mọi thứ
 * (kể cả `explanation`) lấy từ `GET /quizzes/:id/attempts/:attemptId`.
 */

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Target, Loader2 } from "lucide-react";
import { QuizAttemptReview } from "@/components/quiz";
import { useQuiz, useQuizAttemptDetail } from "@/hooks/queries/use-quiz";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

interface StatCardProps {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  tone?: "pass" | "fail" | "neutral";
}

function StatCard({ icon: Icon, label, value, tone = "neutral" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div
        className={cn(
          "mb-1 flex items-center gap-2 text-xs uppercase tracking-wide",
          tone === "pass" && "text-emerald-600",
          tone === "fail" && "text-rose-600",
          tone === "neutral" && "text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

export default function QuizResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = String(params.id ?? "");
  const attemptId = searchParams.get("attempt") ?? undefined;

  const { data: quiz } = useQuiz(quizId);
  const { data: attempt, isLoading, isError } = useQuizAttemptDetail(quizId, attemptId);

  const correctCount = useMemo(
    () => attempt?.answers.filter((a) => a.is_correct === true).length ?? 0,
    [attempt]
  );

  if (!attemptId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-gray-600">Thiếu thông tin lần làm bài.</p>
        <Link href={`/quizzes/${quizId}`} className="mt-4 inline-block text-sm text-primary-600 hover:underline">
          Làm bài kiểm tra
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" aria-hidden="true" />
      </div>
    );
  }

  if (isError || !attempt) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-gray-600">Không tải được kết quả bài làm.</p>
        <Link href={`/quizzes/${quizId}`} className="mt-4 inline-block text-sm text-primary-600 hover:underline">
          Về trang bài kiểm tra
        </Link>
      </div>
    );
  }

  const percentage = attempt.percentage ?? 0;
  const passed = attempt.is_passed === true;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold">{quiz?.title ?? "Kết quả bài kiểm tra"}</h1>
        <p className="text-sm text-muted-foreground">
          {passed ? "Bạn đã đạt bài kiểm tra này." : "Bạn chưa đạt bài kiểm tra này — xem lại phần chưa đúng bên dưới."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={passed ? CheckCircle2 : XCircle}
          label="Điểm"
          value={`${Math.round(percentage)}%`}
          tone={passed ? "pass" : "fail"}
        />
        <StatCard icon={CheckCircle2} label="Câu đúng" value={`${correctCount}/${attempt.answers.length}`} />
        <StatCard icon={Clock} label="Thời gian" value={formatTime(attempt.time_spent_seconds ?? 0)} />
        <StatCard
          icon={Target}
          label="Điểm đạt"
          value={quiz?.pass_percentage != null ? `${quiz.pass_percentage}%` : "—"}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/quizzes/${quizId}`}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Làm lại
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Chi tiết từng câu</h2>
        <QuizAttemptReview answers={attempt.answers} />
      </div>
    </div>
  );
}
