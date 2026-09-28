"use client";

/**
 * /teacher/contests/[id] — chi tiết cuộc thi của giảng viên: sửa (bản nháp/bị từ chối), gửi duyệt,
 * xoá, xem người tham gia. Không có nút chốt kết quả (ĐÍNH CHÍNH 28/09: chỉ quản trị viên chốt).
 * Cuộc thi của người khác → backend 404 → hiện thông báo tiếng Việt qua QueryState.
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { QueryState } from "@/components/common/query-state";
import { ContestForm } from "@/components/contest-manage/contest-form";
import { ContestSummary } from "@/components/contest-manage/contest-summary";
import { ParticipantsTable } from "@/components/contest-manage/participants-table";
import { ContestRowActions } from "@/components/contest-manage/teacher-row-actions";
import { useManagedContest, useUpdateContest } from "@/hooks/queries/use-contest-manage";
import { getTeacherContestActions } from "@/lib/contest-manage/actions";
import { contestErrorMessage } from "@/lib/contest-manage/errors";
import { contestToForm } from "@/lib/contest-manage/form";

export default function TeacherContestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: contest, isLoading, isError, error, refetch } = useManagedContest(id);
  const update = useUpdateContest();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/teacher/contests" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Cuộc thi của tôi
      </Link>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={isError ? new Error(contestErrorMessage(error, "Không tải được cuộc thi.")) : undefined}
        onRetry={() => refetch()}
      >
        {contest && (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="min-w-0 break-words text-2xl font-bold">{contest.title}</h1>
              <ContestRowActions contest={contest} hideEditLink redirectAfterDelete />
            </div>
            <ContestSummary contest={contest} />
            {contest.phase === "ENDED" && (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200" data-testid="await-finalize-note">
                Cuộc thi đã kết thúc. Quản trị viên sẽ chốt kết quả và phát thưởng.
              </p>
            )}

            {getTeacherContestActions(contest).canEdit ? (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Sửa cuộc thi</h2>
                <ContestForm
                  key={contest.updated_at}
                  initialValues={contestToForm(contest)}
                  currentQuiz={contest.quiz}
                  submitLabel="Lưu thay đổi"
                  isPending={update.isPending}
                  onSubmit={(body) => update.mutate({ id: contest.id, body })}
                />
              </section>
            ) : null}

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Người tham gia</h2>
              <ParticipantsTable contestId={contest.id} />
            </section>
          </>
        )}
      </QueryState>
    </div>
  );
}
