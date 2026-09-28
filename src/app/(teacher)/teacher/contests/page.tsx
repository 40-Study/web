"use client";

/**
 * /teacher/contests — cuộc thi do giảng viên tạo (GET /contests/manage).
 * Sửa/xoá/gửi duyệt chỉ ở bản nháp hoặc bị từ chối. KHÔNG có nút chốt kết quả: ĐÍNH CHÍNH 28/09,
 * chỉ quản trị viên chốt.
 */

import { useState } from "react";
import Link from "next/link";
import { Plus, Trophy } from "lucide-react";

import { QueryState } from "@/components/common/query-state";
import { ContestRowActions } from "@/components/contest-manage/teacher-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMyManagedContests } from "@/hooks/queries/use-contest-manage";
import { formatVnDateTime } from "@/lib/contest-manage/format";
import { CONTEST_STATUS_LABEL, phaseLabel, phaseVariant } from "@/lib/contest-manage/labels";
import { isContestStatus } from "@/lib/contest-manage/labels";
import { CONTEST_STATUSES, type ContestStatus } from "@/types/contest";

export default function TeacherContestsPage() {
  const [status, setStatus] = useState<ContestStatus | "">("");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useMyManagedContests({
    status: status || undefined,
    page,
    limit: 12,
  });
  const contests = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Trophy className="h-6 w-6 shrink-0 text-primary-600" />
            Cuộc thi của tôi
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tạo cuộc thi trắc nghiệm, gửi quản trị viên duyệt. Kết quả do quản trị viên chốt sau khi cuộc thi kết thúc.
          </p>
        </div>
        <Button asChild>
          <Link href="/teacher/contests/create" data-testid="create-contest-link">
            <Plus className="mr-1 h-4 w-4" />
            Tạo cuộc thi
          </Link>
        </Button>
      </div>

      <select
        value={status}
        aria-label="Lọc theo trạng thái"
        onChange={(e) => {
          setStatus(isContestStatus(e.target.value) ? e.target.value : "");
          setPage(1);
        }}
        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm sm:w-64 dark:border-gray-700 dark:bg-gray-900"
      >
        <option value="">Tất cả trạng thái</option>
        {CONTEST_STATUSES.map((s) => (
          <option key={s} value={s}>
            {CONTEST_STATUS_LABEL[s]}
          </option>
        ))}
      </select>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && contests.length === 0}
        emptyTitle="Chưa có cuộc thi nào"
        emptyDescription="Bấm “Tạo cuộc thi” để bắt đầu."
      >
        <ul className="space-y-3" data-testid="teacher-contest-list">
          {contests.map((c) => (
            <li
              key={c.id}
              data-testid={`teacher-contest-${c.id}`}
              className="rounded-xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-950"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/teacher/contests/${c.id}`} className="break-words font-semibold hover:underline">
                      {c.title}
                    </Link>
                    <Badge variant={phaseVariant(c.phase)}>{phaseLabel(c.phase)}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatVnDateTime(c.start_time)} → {formatVnDateTime(c.end_time)} · {c.duration_minutes} phút ·{" "}
                    {c.participant_count} người tham gia
                  </p>
                  {c.status === "REJECTED" && c.reject_reason && (
                    <p className="text-sm text-red-600" data-testid="reject-reason">
                      Lý do từ chối: {c.reject_reason}
                    </p>
                  )}
                  {c.status === "CANCELLED" && c.cancel_reason && (
                    <p className="text-sm text-gray-600">Lý do huỷ: {c.cancel_reason}</p>
                  )}
                </div>
                <ContestRowActions contest={c} />
              </div>
            </li>
          ))}
        </ul>
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Trang {page}/{data.total_pages}
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
    </div>
  );
}
