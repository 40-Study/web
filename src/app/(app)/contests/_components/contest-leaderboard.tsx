"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContestLeaderboard } from "@/hooks/queries/use-contests";
import { contestErrorCode, contestErrorMessage } from "@/lib/contest/contest-errors";
import {
  contestRevealAt,
  formatContestDuration,
  formatContestPercent,
  formatContestScore,
  resolveLeaderboardVisibility,
} from "@/lib/contest/contest-format";
import { cn } from "@/lib/utils";
import type { ContestPhase } from "@/types/contest";
import { ContestLoading } from "./contest-states";
import { useServerCountdown } from "./use-server-countdown";

const MEDAL_COLOR: Record<number, string> = { 1: "text-amber-500", 2: "text-slate-400", 3: "text-orange-600" };

interface ContestLeaderboardProps {
  contestId: string;
  phase: ContestPhase;
  endTime: string;
  serverTime: string;
  /** `dataUpdatedAt` của truy vấn chi tiết — xem useServerCountdown. */
  receivedAt?: number;
}

/**
 * BXH (#16): công khai từ `end_time + 30s` (ĐÍNH CHÍNH 2), backend trả 403 trước mốc đó. Trong
 * 30 giây ân hạn component tự đếm ngược theo giờ server và bật truy vấn đúng lúc qua mốc — không
 * gọi sớm (sẽ nhận 403) và không bắt người dùng tải lại trang.
 */
export function ContestLeaderboard({ contestId, phase, endTime, serverTime, receivedAt }: ContestLeaderboardProps) {
  const [page, setPage] = useState(1);
  const revealAt = contestRevealAt(endTime);
  const revealRemaining = useServerCountdown(phase === "ENDED" ? revealAt : null, serverTime, undefined, receivedAt);
  const visibility = resolveLeaderboardVisibility(phase, revealAt, revealRemaining);
  const query = useContestLeaderboard(contestId, page, visibility.visible);

  if (!visibility.visible) {
    return (
      <p className="text-sm text-gray-600" role="status">
        {visibility.message}
      </p>
    );
  }
  if (query.isLoading) return <ContestLoading label="Đang tải bảng xếp hạng…" />;
  if (query.error) {
    const hidden = contestErrorCode(query.error) === "CONTEST_LEADERBOARD_HIDDEN";
    return (
      <div className="space-y-2 text-sm" role={hidden ? "status" : "alert"}>
        <p className={hidden ? "text-gray-600" : "text-red-600"}>{contestErrorMessage(query.error)}</p>
        {!hidden && (
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Thử lại
          </Button>
        )}
      </div>
    );
  }
  const data = query.data;
  if (!data || data.items.length === 0) {
    return <p className="text-sm text-gray-600">Chưa có ai nộp bài trong cuộc thi này.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        {data.finalized ? "Kết quả đã được chốt chính thức." : "Xếp hạng tạm thời, chờ quản trị viên chốt kết quả."} Điểm bằng nhau thì
        ai nộp trước xếp trên.
      </p>
      <ol className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
        {data.items.map((row) => (
          <li
            key={`${row.rank}-${row.user_name}`}
            className={cn("flex items-center gap-3 px-3 py-2.5", row.is_me && "bg-primary-50")}
          >
            <span className="flex w-8 shrink-0 justify-center font-bold text-gray-700">
              {row.rank <= 3 ? <Medal className={cn("h-5 w-5", MEDAL_COLOR[row.rank])} aria-label={`Hạng ${row.rank}`} /> : row.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {row.user_name}
                {row.is_me && <span className="ml-1.5 text-xs font-semibold text-primary-700">(Bạn)</span>}
              </p>
              <p className="text-xs text-gray-500">{formatContestDuration(row.time_spent_seconds)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-gray-900">
                {formatContestScore(row.score)}/{formatContestScore(row.total_points)}
              </p>
              <p className="text-xs text-gray-500">{formatContestPercent(row.percentage)}</p>
            </div>
          </li>
        ))}
      </ol>
      {data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Trang trước">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="text-sm text-gray-600">
            {data.page}/{data.total_pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)} aria-label="Trang sau">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
