"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Clock, MapPin, Radio, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveSessions } from "@/hooks/queries/use-live-sessions";
import {
  formatLiveDate,
  formatLiveTimeRange,
  groupLiveSessions,
  LIVE_STATUS_LABEL,
} from "@/lib/live-session-display";
import type { LiveSession } from "@/services/live-session.service";

/**
 * A-08 (QA hồi quy 03/10): học viên trước đây không có đường nào vào danh sách buổi livestream — menu
 * không có mục này, /schedule chỉ vẽ thời khoá biểu tuần. Backend `GET /livestream` tự lọc theo người
 * gọi (host, giảng viên lớp, học viên đã ghi danh lớp), nên trang này chỉ hiện buổi học viên được xem.
 */
const PAGE_SIZE = 50;

function SessionCard({ session }: { session: LiveSession }) {
  const isLive = session.status === "live";
  const date = formatLiveDate(session.scheduled_at ?? session.started_at);
  const time = formatLiveTimeRange(session.scheduled_at ?? session.started_at, session.scheduled_end_at ?? session.ended_at);

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between",
        isLive ? "border-red-200" : "border-gray-200"
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-semibold text-gray-900">{session.title}</h3>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              isLive && "bg-red-100 text-red-700",
              session.status === "scheduled" && "bg-blue-50 text-blue-700",
              (session.status === "ended" || session.status === "cancelled") && "bg-gray-100 text-gray-600"
            )}
          >
            {isLive && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />}
            {LIVE_STATUS_LABEL[session.status]}
          </span>
        </div>
        {session.description && <p className="line-clamp-2 text-sm text-gray-500">{session.description}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          {(date || time) && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
              {[date, time].filter(Boolean).join(" · ")}
            </span>
          )}
          {session.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" />
              {session.location}
            </span>
          )}
        </div>
      </div>

      {isLive ? (
        <Link
          href={`/rooms/${session.id}`}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <Video className="h-4 w-4" aria-hidden="true" />
          Vào lớp
        </Link>
      ) : session.status === "scheduled" ? (
        <span className="shrink-0 text-sm text-gray-500">Chưa bắt đầu</span>
      ) : null}
    </li>
  );
}

function Section({ title, sessions }: { title: string; sessions: LiveSession[] }) {
  if (sessions.length === 0) return null;
  return (
    <section className="space-y-3" aria-label={title}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title} ({sessions.length})
      </h2>
      <ul className="space-y-3">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} />
        ))}
      </ul>
    </section>
  );
}

export default function StudentLivestreamPage() {
  const { data, isLoading, isError } = useLiveSessions({ page_size: PAGE_SIZE });
  const groups = useMemo(() => groupLiveSessions(data?.sessions ?? []), [data]);
  const isEmpty = groups.live.length + groups.upcoming.length + groups.past.length === 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
          <Radio className="h-6 w-6 text-red-500" aria-hidden="true" />
          Livestream
        </h1>
        <p className="mt-1 text-sm text-gray-500">Các buổi học trực tiếp của những lớp bạn đang tham gia.</p>
      </header>

      {isLoading ? (
        <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500">Đang tải…</div>
      ) : isError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
          Không thể tải danh sách buổi học trực tiếp. Vui lòng tải lại trang.
        </div>
      ) : isEmpty ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          Chưa có buổi học trực tiếp nào cho các lớp của bạn.
        </div>
      ) : (
        <div className="space-y-8">
          <Section title="Đang diễn ra" sessions={groups.live} />
          <Section title="Sắp diễn ra" sessions={groups.upcoming} />
          <Section title="Đã kết thúc" sessions={groups.past} />
        </div>
      )}
    </div>
  );
}
