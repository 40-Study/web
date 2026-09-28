"use client";

/**
 * Kết quả của chính mình (#15 `GET /contests/:id/my-result`). Điểm hiện ngay sau khi nộp; đáp án
 * và giải thích chỉ có khi cuộc thi đã đóng (backend trả `questions = null` trước đó, §4.3).
 */
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useContestDetail, useContestMyResult } from "@/hooks/queries/use-contests";
import { contestPath } from "@/lib/contest/contest-cta";
import { contestErrorCode } from "@/lib/contest/contest-errors";
import {
  formatContestDateTime,
  formatContestDuration,
  formatContestPercent,
  formatContestScore,
} from "@/lib/contest/contest-format";
import { ContestAnswerReview } from "../../_components/contest-answer-review";
import { ContestPhaseBadge } from "../../_components/contest-card";
import { ContestAnswersPending, ContestAwardPanel } from "../../_components/contest-result-parts";
import { ContestErrorState, ContestLoading } from "../../_components/contest-states";

export default function ContestResultPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const detailQuery = useContestDetail(slug);
  const resultQuery = useContestMyResult(detailQuery.data?.id);

  if (detailQuery.isLoading || (detailQuery.data && resultQuery.isLoading)) return <ContestLoading label="Đang tải kết quả…" />;
  const error = detailQuery.error ?? resultQuery.error;
  if (error || !detailQuery.data || !resultQuery.data) {
    const noResult = contestErrorCode(error) === "CONTEST_RESULT_NOT_FOUND";
    return (
      <div className="px-4 py-10">
        <ContestErrorState
          error={error}
          title={noResult ? "Chưa có kết quả" : "Không tải được kết quả"}
          onRetry={noResult ? undefined : () => (detailQuery.error ? detailQuery.refetch() : resultQuery.refetch())}
          backHref={detailQuery.data ? contestPath(slug) : "/contests"}
          backLabel={detailQuery.data ? "Về trang cuộc thi" : "Về danh sách cuộc thi"}
        />
      </div>
    );
  }

  const detail = detailQuery.data;
  const result = resultQuery.data;
  const mine = result.my_participation;
  const award = mine?.award ?? null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      <Link href={contestPath(slug)} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {detail.title}
      </Link>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-gray-900">Kết quả của bạn</h1>
          <ContestPhaseBadge phase={detail.phase} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Điểm" value={`${formatContestScore(mine?.score)}/${formatContestScore(mine?.total_points)}`} />
          <Stat label="Tỉ lệ" value={formatContestPercent(mine?.percentage)} />
          <Stat label="Thời gian" value={formatContestDuration(mine?.time_spent_seconds)} />
          <Stat label="Hạng" value={mine?.rank !== null && mine?.rank !== undefined ? `${mine.rank}` : "Chưa chốt"} />
        </div>
        <p className="text-xs text-gray-500">Nộp lúc {formatContestDateTime(mine?.submitted_at)}</p>

        {award && (award.certificate_number || award.voucher) ? (
          <ContestAwardPanel slug={slug} award={award} />
        ) : detail.phase === "FINALIZED" ? (
          <p className="text-sm text-gray-600">Kết quả đã chốt. Lần này bạn chưa đạt giải, hẹn gặp lại ở cuộc thi sau.</p>
        ) : (
          <p className="text-sm text-gray-600">Hạng và giải thưởng có sau khi quản trị viên chốt kết quả.</p>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Đáp án và giải thích</h2>
        {result.questions === null ? (
          <ContestAnswersPending
            answersAvailableAt={result.answers_available_at}
            serverTime={detail.server_time}
            receivedAt={detailQuery.dataUpdatedAt}
            // Trễ 1,5 giây như trang chi tiết: gọi đúng giây 0 có thể vẫn nhận `questions: null`.
            onAvailable={() => window.setTimeout(() => resultQuery.refetch(), 1500)}
          />
        ) : (
          <ContestAnswerReview answers={result.questions} />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 break-words text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
