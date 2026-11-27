"use client";

/** Bảng người tham gia (GET /contests/manage/:id/participants) — dùng chung giảng viên + admin. */

import { useState } from "react";

import { QueryState } from "@/components/common/query-state";
import { useContestParticipants } from "@/hooks/queries/use-contest-manage";
import { formatVnDateTime } from "@/lib/contest-manage/format";
import { ATTEMPT_STATUS_LABEL } from "@/lib/contest-manage/labels";
import type { ContestPhase } from "@/types/contest";

function formatSeconds(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} phút ${s} giây`;
}

/**
 * QA4-A13: "Học viên đăng ký sau khi cuộc thi được công bố sẽ hiện ở đây." sai với cuộc thi đã kết thúc/huỷ.
 * Lời trống theo phase; không truyền phase thì giữ lời cũ.
 */
export function participantsEmptyCopy(phase?: ContestPhase): { title: string; description: string } {
  if (phase === "ENDED" || phase === "FINALIZED") {
    return { title: "Không có ai tham gia", description: "Cuộc thi đã kết thúc mà không có học viên nào tham gia." };
  }
  if (phase === "CANCELLED") {
    return { title: "Không có ai tham gia", description: "Cuộc thi đã huỷ, không có học viên nào tham gia." };
  }
  if (phase === "ACTIVE") {
    return { title: "Chưa có người tham gia", description: "Học viên vào thi sẽ hiện ở đây." };
  }
  return { title: "Chưa có người tham gia", description: "Học viên đăng ký sau khi cuộc thi được công bố sẽ hiện ở đây." };
}

export function ParticipantsTable({ contestId, phase }: { contestId: string; phase?: ContestPhase }) {
  const empty = participantsEmptyCopy(phase);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useContestParticipants(contestId, page);
  const rows = data?.items ?? [];

  return (
    <QueryState
      hasData={data !== undefined}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => refetch()}
      isEmpty={!isLoading && rows.length === 0}
      emptyTitle={empty.title}
      emptyDescription={empty.description}
    >
      <div className="overflow-x-auto rounded-xl border dark:border-gray-800">
        <table className="min-w-full text-sm" data-testid="participants-table">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-3 py-2 text-left">Hạng</th>
              <th className="px-3 py-2 text-left">Học viên</th>
              <th className="px-3 py-2 text-left">Trạng thái</th>
              <th className="px-3 py-2 text-left">Điểm</th>
              <th className="px-3 py-2 text-left">Thời gian làm</th>
              <th className="px-3 py-2 text-left">Nộp lúc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => (
              <tr key={row.user_id}>
                <td className="px-3 py-2">{row.rank ?? "—"}</td>
                <td className="px-3 py-2 font-medium">{row.user_name}</td>
                <td className="px-3 py-2">{ATTEMPT_STATUS_LABEL[row.attempt_status] ?? row.attempt_status}</td>
                <td className="px-3 py-2">
                  {row.score === null ? "—" : `${row.score}${row.percentage === null ? "" : ` (${row.percentage}%)`}`}
                </td>
                <td className="px-3 py-2">{formatSeconds(row.time_spent_seconds)}</td>
                <td className="whitespace-nowrap px-3 py-2">{formatVnDateTime(row.submitted_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between pt-2 text-sm text-gray-500">
          <span>
            Trang {page}/{data.total_pages} — {data.total_count} người
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700"
            >
              Trước
            </button>
            <button
              disabled={page >= data.total_pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </QueryState>
  );
}
