"use client";

/**
 * Chi tiết cuộc thi (contract §7, #7 `GET /contests/:slug`, OptionalAuth). Mọi quyết định "được
 * làm gì" lấy từ `viewer` backend trả về (resolveContestCta), đồng hồ theo `server_time`.
 */
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Award, CalendarClock, Clock, HelpCircle, Lock, Trophy, User, Users } from "lucide-react";
import { useContestDetail } from "@/hooks/queries/use-contests";
import { contestErrorCode } from "@/lib/contest/contest-errors";
import {
  formatContestDateTime,
  formatContestPercent,
  formatContestPrize,
  formatContestScore,
  formatCountdown,
} from "@/lib/contest/contest-format";
import { normalizeRole } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth.store";
import type { ContestDetail } from "@/types/contest";
import { ContestPhaseBadge } from "../_components/contest-card";
import { ContestCtaPanel } from "../_components/contest-cta-panel";
import { ContestLeaderboard } from "../_components/contest-leaderboard";
import { ContestErrorState, ContestLoading } from "../_components/contest-states";
import { useServerCountdown } from "../_components/use-server-countdown";

export default function ContestDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { activeRole } = useAuthStore();
  const query = useContestDetail(slug);

  if (query.isLoading) return <ContestLoading />;
  if (query.error || !query.data) {
    const notFound = contestErrorCode(query.error) === "CONTEST_NOT_FOUND";
    return (
      <div className="px-4 py-10">
        <ContestErrorState
          error={query.error}
          title={notFound ? "Không tìm thấy cuộc thi" : "Không tải được cuộc thi"}
          onRetry={notFound ? undefined : () => query.refetch()}
        />
      </div>
    );
  }

  // Tải lại khi đồng hồ chạm mốc mở/đóng. Trễ 1,5 giây: đồng hồ web và server lệch vài trăm ms,
  // gọi đúng giây 0 có thể nhận lại phase cũ và đồng hồ đứng ở 00:00:00.
  const refreshSoon = () => window.setTimeout(() => query.refetch(), 1500);
  return <ContestDetailView detail={query.data} receivedAt={query.dataUpdatedAt} activeRole={normalizeRole(activeRole)} onRefresh={refreshSoon} />;
}

function ContestDetailView({ detail, receivedAt, activeRole, onRefresh }: { detail: ContestDetail; receivedAt: number; activeRole: string | null; onRefresh: () => void }) {
  const boundary = detail.phase === "UPCOMING" ? detail.start_time : detail.phase === "ACTIVE" ? detail.end_time : null;
  const remaining = useServerCountdown(boundary, detail.server_time, onRefresh, receivedAt);
  const mine = detail.viewer.my_participation;
  const seats = detail.max_participants > 0 ? `${detail.participant_count}/${detail.max_participants}` : `${detail.participant_count}`;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <Link href="/contests" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Tất cả cuộc thi
      </Link>

      {detail.banner_url && (
        // eslint-disable-next-line @next/next/no-img-element -- banner do người dùng nhập, domain tuỳ ý
        <img src={detail.banner_url} alt="" className="aspect-[3/1] w-full rounded-2xl object-cover" />
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0 space-y-5">
          <div className="space-y-2">
            <ContestPhaseBadge phase={detail.phase} />
            <h1 className="break-words text-2xl font-bold text-gray-900">{detail.title}</h1>
            {detail.description && <p className="whitespace-pre-line break-words text-gray-700">{detail.description}</p>}
          </div>

          <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm sm:grid-cols-2">
            <InfoRow icon={CalendarClock} label="Mở lúc" value={formatContestDateTime(detail.start_time)} />
            <InfoRow icon={CalendarClock} label="Đóng lúc" value={formatContestDateTime(detail.end_time)} />
            <InfoRow icon={Clock} label="Thời gian làm bài" value={`${detail.duration_minutes} phút`} />
            <InfoRow icon={HelpCircle} label="Đề thi" value={`${detail.question_count} câu · ${formatContestScore(detail.total_points)} điểm`} />
            <InfoRow icon={Users} label="Người tham gia" value={seats} />
            <InfoRow icon={User} label="Người tạo" value={detail.creator_name} />
            {detail.course && (
              <InfoRow
                icon={Lock}
                label="Dành cho học viên khoá"
                value={
                  <Link href={`/courses/${encodeURIComponent(detail.course.slug)}`} className="text-primary-700 hover:underline">
                    {detail.course.title}
                  </Link>
                }
              />
            )}
          </dl>

          <section className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <Award className="h-5 w-5 text-violet-600" aria-hidden="true" />
              Giải thưởng
            </h2>
            {detail.prizes.length === 0 && detail.certificate_min_percentage === null ? (
              <p className="text-sm text-gray-600">Cuộc thi này không có giải thưởng.</p>
            ) : (
              <ul className="space-y-1 text-sm text-gray-700">
                {detail.prizes.map((p) => (
                  <li key={p.id}>• {formatContestPrize(p)}</li>
                ))}
                {detail.certificate_min_percentage !== null && (
                  <li>• Đạt từ {formatContestPercent(detail.certificate_min_percentage)} số điểm trở lên: Chứng nhận</li>
                )}
              </ul>
            )}
            <p className="text-xs text-gray-500">Giải được trao sau khi quản trị viên chốt kết quả.</p>
          </section>

          <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <Trophy className="h-5 w-5 text-amber-500" aria-hidden="true" />
              Bảng xếp hạng
            </h2>
            <ContestLeaderboard contestId={detail.id} phase={detail.phase} endTime={detail.end_time} serverTime={detail.server_time} receivedAt={receivedAt} />
          </section>
        </section>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            {remaining !== null && (
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide text-gray-500">{detail.phase === "UPCOMING" ? "Mở sau" : "Kết thúc sau"}</p>
                <p className="font-mono text-2xl font-bold text-gray-900" role="timer">
                  {formatCountdown(remaining)}
                </p>
              </div>
            )}
            <ContestCtaPanel detail={detail} receivedAt={receivedAt} activeRole={activeRole} onPhaseBoundary={onRefresh} />
          </div>

          {mine && mine.attempt_status === "SUBMITTED" && (
            <div className="space-y-1 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
              <p className="font-semibold text-gray-900">Kết quả của bạn</p>
              <p>
                {formatContestScore(mine.score)}/{formatContestScore(mine.total_points)} điểm ({formatContestPercent(mine.percentage)})
              </p>
              {mine.rank !== null && <p>Hạng chính thức: {mine.rank}</p>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="break-words font-medium text-gray-900">{value}</dd>
      </div>
    </div>
  );
}
