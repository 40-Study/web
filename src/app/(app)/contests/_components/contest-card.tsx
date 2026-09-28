"use client";

import Link from "next/link";
import { Award, CalendarClock, Clock, HelpCircle, Lock, Ticket, Users } from "lucide-react";
import { contestPath } from "@/lib/contest/contest-cta";
import {
  CONTEST_PHASE_BADGE,
  CONTEST_PHASE_LABELS,
  formatContestDateTime,
  formatContestPercent,
  formatContestScore,
} from "@/lib/contest/contest-format";
import { cn } from "@/lib/utils";
import type { ContestPhase, ContestSummary, MyParticipation } from "@/types/contest";

export function ContestPhaseBadge({ phase, className }: { phase: ContestPhase; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", CONTEST_PHASE_BADGE[phase], className)}>
      {CONTEST_PHASE_LABELS[phase]}
    </span>
  );
}

const PARTICIPATION_LABEL: Record<MyParticipation["attempt_status"], string> = {
  NOT_STARTED: "Đã đăng ký",
  IN_PROGRESS: "Đang làm bài",
  SUBMITTED: "Đã nộp bài",
  EXPIRED: "Hết giờ, không tính",
};

interface ContestCardProps {
  contest: ContestSummary;
  participation?: MyParticipation | null;
}

export function ContestCard({ contest, participation }: ContestCardProps) {
  const seats = contest.max_participants > 0 ? `${contest.participant_count}/${contest.max_participants}` : `${contest.participant_count}`;
  const hasCertificatePrize = contest.prizes.some((p) => p.grant_certificate);

  return (
    <Link
      href={contestPath(contest.slug)}
      className="group flex min-w-0 flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 break-words text-base font-semibold text-gray-900 group-hover:text-primary-700">{contest.title}</h3>
        <ContestPhaseBadge phase={contest.phase} />
      </div>

      {contest.description && <p className="line-clamp-2 break-words text-sm text-gray-600">{contest.description}</p>}

      <div className="flex flex-wrap gap-1.5">
        {contest.course && (
          <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
            <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">Học viên khoá {contest.course.title}</span>
          </span>
        )}
        {hasCertificatePrize && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
            <Award className="h-3 w-3" aria-hidden="true" />
            Chứng nhận
          </span>
        )}
        {contest.has_voucher_prize && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
            <Ticket className="h-3 w-3" aria-hidden="true" />
            Voucher
          </span>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-1.5 text-xs text-gray-600 sm:grid-cols-2">
        <div className="flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Mở lúc</dt>
          <dd>{formatContestDateTime(contest.start_time)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Thời lượng</dt>
          <dd>{contest.duration_minutes} phút làm bài</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Số câu</dt>
          <dd>{contest.question_count} câu · {formatContestScore(contest.total_points)} điểm</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Người tham gia</dt>
          <dd>{seats} người tham gia</dd>
        </div>
      </dl>

      {participation && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700">
          <span className="font-semibold">{PARTICIPATION_LABEL[participation.attempt_status]}</span>
          {participation.attempt_status === "SUBMITTED" && (
            <span>
              {formatContestScore(participation.score)}/{formatContestScore(participation.total_points)} điểm ·{" "}
              {formatContestPercent(participation.percentage)}
            </span>
          )}
          {participation.rank !== null && <span>Hạng {participation.rank}</span>}
        </div>
      )}
    </Link>
  );
}
