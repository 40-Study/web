"use client";

/**
 * /admin/contests/[id] — duyệt (kèm gắn voucher cho giải), từ chối có lý do, huỷ, sửa giải, xem
 * người tham gia và CHỐT kết quả. ĐÍNH CHÍNH 28/09: chốt chỉ ở đây (POST /admin/contests/:id/finalize),
 * hợp lệ khi cuộc thi đã kết thúc ít nhất 60 giây; bấm lần 2 backend trả already_finalized=true.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ApproveConfirmDialog } from "@/components/admin/review-dialogs";
import { QueryState } from "@/components/common/query-state";
import { ContestSummary } from "@/components/contest-manage/contest-summary";
import { ParticipantsTable } from "@/components/contest-manage/participants-table";
import { PrizeEditor } from "@/components/contest-manage/prize-editor";
import { ReasonDialog } from "@/components/contest-manage/reason-dialog";
import { Button } from "@/components/ui/button";
import {
  useApproveContest,
  useCancelContest,
  useContestVoucherOptions,
  useFinalizeContest,
  useManagedContest,
  useRejectContest,
  useUpdateContestPrizes,
} from "@/hooks/queries/use-contest-manage";
import { getAdminContestActions } from "@/lib/contest-manage/actions";
import { contestErrorMessage } from "@/lib/contest-manage/errors";
import { formatVnDateTime } from "@/lib/contest-manage/format";
import { prizeDraftsToInput, prizesToDrafts, validatePrizes, type PrizeDraft } from "@/lib/contest-manage/form";
import { useAuthStore } from "@/stores/auth.store";
import type { ContestManage } from "@/types/contest";

/** Nhịp cập nhật đồng hồ để nút "Chốt" tự mở khi qua mốc end_time + 60s mà không cần tải lại. */
const CLOCK_TICK_MS = 5_000;

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
}

type Dialog = "approve" | "reject" | "cancel" | "finalize" | null;

function AdminContestActionsPanel({ contest }: { contest: ContestManage }) {
  const viewerId = useAuthStore((s) => s.user?.id);
  const now = useNow();
  const actions = getAdminContestActions(contest, viewerId, now);

  const [prizes, setPrizes] = useState<PrizeDraft[]>(() => prizesToDrafts(contest));
  const [prizeError, setPrizeError] = useState<string | undefined>();
  const [dialog, setDialog] = useState<Dialog>(null);
  const vouchers = useContestVoucherOptions(actions.canEditPrizes);
  const voucherOptions = useMemo(() => {
    const opts = (vouchers.data ?? []).map((v) => ({ id: v.id, label: `${v.name} (${v.code})` }));
    // Voucher đang gắn có thể đã bị tắt: vẫn hiện để admin thấy và đổi, thay vì ô trống khó hiểu.
    for (const p of contest.prizes) {
      if (p.voucher && !opts.some((o) => o.id === p.voucher?.id)) {
        opts.push({ id: p.voucher.id, label: `${p.voucher.name} (${p.voucher.code}) — không còn hoạt động` });
      }
    }
    return opts;
  }, [vouchers.data, contest.prizes]);

  const approve = useApproveContest();
  const reject = useRejectContest();
  const cancel = useCancelContest();
  const savePrizes = useUpdateContestPrizes();
  const finalize = useFinalizeContest();

  const checkPrizes = (): boolean => {
    const problem = validatePrizes(prizes, true);
    setPrizeError(problem ?? undefined);
    return !problem;
  };

  const close = () => setDialog(null);

  return (
    <div className="space-y-6">
      {actions.canEditPrizes && (
        <section className="space-y-3 rounded-xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <h2 className="font-semibold">Cơ cấu giải (gắn voucher)</h2>
          {vouchers.isError && (
            <p role="alert" className="text-sm text-red-600">
              {contestErrorMessage(vouchers.error, "Không tải được danh sách voucher.")}
            </p>
          )}
          <PrizeEditor
            value={prizes}
            onChange={setPrizes}
            allowVoucher
            voucherOptions={voucherOptions}
            error={prizeError}
          />
          {contest.status === "PUBLISHED" && (
            <Button
              variant="outline"
              size="sm"
              isLoading={savePrizes.isPending}
              data-testid="save-prizes"
              onClick={() => checkPrizes() && savePrizes.mutate({ id: contest.id, prizes: prizeDraftsToInput(prizes) })}
            >
              Lưu cơ cấu giải
            </Button>
          )}
        </section>
      )}

      <div className="flex flex-wrap gap-2" data-testid="admin-actions">
        {actions.canApprove && (
          <Button onClick={() => checkPrizes() && setDialog("approve")} data-testid="approve-contest">
            Duyệt và công bố
          </Button>
        )}
        {actions.canReject && (
          <Button variant="destructive" onClick={() => setDialog("reject")} data-testid="reject-contest">
            Từ chối
          </Button>
        )}
        {actions.canCancel && (
          <Button variant="outline" onClick={() => setDialog("cancel")} data-testid="cancel-contest">
            Huỷ cuộc thi
          </Button>
        )}
        {actions.finalize.kind === "ready" && (
          <Button onClick={() => setDialog("finalize")} data-testid="finalize-contest">
            Chốt kết quả
          </Button>
        )}
        {actions.finalize.kind === "wait" && (
          <div className="flex flex-col gap-1">
            <Button disabled data-testid="finalize-contest">
              Chốt kết quả
            </Button>
            <span className="text-xs text-gray-500" data-testid="finalize-wait">
              Mở chốt lúc {formatVnDateTime(actions.finalize.availableAt.toISOString())} (60 giây sau khi kết thúc)
            </span>
          </div>
        )}
        {actions.finalize.kind === "done" && (
          <span className="text-sm text-green-700" data-testid="finalized-note">
            Đã chốt kết quả lúc {formatVnDateTime(contest.finalized_at)}.
          </span>
        )}
      </div>

      <ApproveConfirmDialog
        open={dialog === "approve"}
        title="Duyệt cuộc thi"
        description={
          <>
            Công bố <strong>{contest.title}</strong> với {prizes.length} giải? Học viên sẽ thấy và đăng ký được ngay.
          </>
        }
        confirmLabel="Duyệt và công bố"
        isPending={approve.isPending}
        onConfirm={() =>
          approve.mutate({ id: contest.id, prizes: prizeDraftsToInput(prizes) }, { onSettled: close })
        }
        onClose={close}
      />
      <ApproveConfirmDialog
        open={dialog === "finalize"}
        title="Chốt kết quả"
        description={
          <>
            Chốt kết quả <strong>{contest.title}</strong>? Hệ thống xếp hạng, phát chứng nhận và voucher theo giải,
            rồi gửi thông báo cho thí sinh. Không thể hoàn tác.
          </>
        }
        confirmLabel="Chốt kết quả"
        isPending={finalize.isPending}
        onConfirm={() => finalize.mutate(contest.id, { onSettled: close })}
        onClose={close}
      />
      <ReasonDialog
        open={dialog === "reject"}
        title="Từ chối cuộc thi"
        description={<>Giảng viên sẽ thấy lý do để sửa và gửi duyệt lại.</>}
        fieldLabel="Lý do từ chối"
        submitLabel="Gửi từ chối"
        isPending={reject.isPending}
        onSubmit={(reason) => reject.mutate({ id: contest.id, reason }, { onSuccess: close })}
        onClose={close}
      />
      <ReasonDialog
        open={dialog === "cancel"}
        title="Huỷ cuộc thi"
        description={<>Cuộc thi bị huỷ sẽ không thể mở lại. Người đã đăng ký không được xếp hạng.</>}
        fieldLabel="Lý do huỷ"
        submitLabel="Huỷ cuộc thi"
        isPending={cancel.isPending}
        onSubmit={(reason) => cancel.mutate({ id: contest.id, reason }, { onSuccess: close })}
        onClose={close}
      />
    </div>
  );
}

export default function AdminContestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: contest, isLoading, isError, error, refetch } = useManagedContest(id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/admin/contests" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Danh sách cuộc thi
      </Link>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={isError ? new Error(contestErrorMessage(error, "Không tải được cuộc thi.")) : undefined}
        onRetry={() => refetch()}
      >
        {contest && (
          <>
            <h1 className="break-words text-2xl font-bold">{contest.title}</h1>
            <ContestSummary contest={contest} />
            {/* key: dữ liệu mới từ server (sau duyệt/sửa giải) reset bản nháp giải trong panel. */}
            <AdminContestActionsPanel key={contest.updated_at} contest={contest} />
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
