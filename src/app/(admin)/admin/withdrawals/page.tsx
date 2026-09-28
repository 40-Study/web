"use client";

/**
 * /admin/withdrawals — Phase 4: quản lý yêu cầu rút tiền giảng viên.
 * Endpoints + envelope: xem withdrawal-contract.md (SSOT chung backend + web).
 */

import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useAdminWithdrawals,
  useAdminNegativeBalances,
  useAdminApproveWithdrawal,
  useAdminRejectWithdrawal,
  useAdminMarkWithdrawalCompleted,
} from "@/hooks/queries/use-wallet";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { QueryState } from "@/components/common/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatWithdrawalAmount,
  getWithdrawalStatusLabel,
  getWithdrawalStatusVariant,
} from "@/lib/withdrawal-format";
import type { AdminWithdrawalItem, WithdrawalStatus } from "@/services/wallet.service";

const LIMIT = 20;
const STATUS_LIST: WithdrawalStatus[] = ["pending", "approved", "rejected", "completed"];
const REASON_MAX_LEN = 500;

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString("vi-VN") : "—";
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export default function AdminWithdrawalsPage() {
  const [status, setStatus] = useState<WithdrawalStatus | "">("");
  // Lọc theo giảng viên bằng cách bấm tên trên 1 dòng (thay vì ô gõ UUID tự do: gõ dở UUID thì
  // backend trả 400 và cả bảng rơi vào trạng thái lỗi).
  const [teacherFilter, setTeacherFilter] = useState<{ id: string; label: string } | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useAdminWithdrawals({
    status: status || undefined,
    teacher_id: teacherFilter?.id,
    page,
    limit: LIMIT,
  });
  const { data: negativeBalances, isError: isNegativeError } = useAdminNegativeBalances();

  const approveMutation = useAdminApproveWithdrawal();
  const rejectMutation = useAdminRejectWithdrawal();
  const completeMutation = useAdminMarkWithdrawalCompleted();

  const [approveTarget, setApproveTarget] = useState<AdminWithdrawalItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminWithdrawalItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [completeTarget, setCompleteTarget] = useState<AdminWithdrawalItem | null>(null);
  const [transactionIdInput, setTransactionIdInput] = useState("");

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  function closeReject() {
    setRejectTarget(null);
    setRejectReason("");
  }

  function closeComplete() {
    setCompleteTarget(null);
    setTransactionIdInput("");
  }

  function confirmApprove() {
    if (!approveTarget) return;
    approveMutation.mutate(approveTarget.id, { onSuccess: () => setApproveTarget(null) });
  }

  function confirmReject() {
    if (!rejectTarget || !rejectReason.trim()) return;
    rejectMutation.mutate(
      { id: rejectTarget.id, reason: rejectReason.trim() },
      { onSuccess: closeReject },
    );
  }

  function confirmComplete() {
    if (!completeTarget || !transactionIdInput.trim()) return;
    completeMutation.mutate(
      { id: completeTarget.id, transactionId: transactionIdInput.trim() },
      { onSuccess: closeComplete },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rút tiền giảng viên</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Duyệt, từ chối, và xác nhận đã chuyển khoản cho các yêu cầu rút tiền của giảng viên.
        </p>
      </div>

      {isNegativeError && (
        <p className="text-sm text-red-600">
          Không tải được danh sách giảng viên có số dư âm — kiểm tra lại cột &quot;Số dư hiện tại&quot; trước khi duyệt.
        </p>
      )}

      {/* Banner cảnh báo giáo viên có số dư âm */}
      {negativeBalances && negativeBalances.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {negativeBalances.length} giảng viên đang có số dư âm (do hoàn tiền sau khi đã rút)
          </div>
          <ul className="mt-2 space-y-1">
            {negativeBalances.map((t) => (
              <li key={t.teacher_id}>
                {t.teacher_name || t.teacher_email} ({t.teacher_email}) —{" "}
                <strong>{formatWithdrawalAmount(t.available_balance)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters */}
      <section className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            value={status || "ALL"}
            onValueChange={(v) => {
              setStatus(v === "ALL" ? "" : (v as WithdrawalStatus));
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              {STATUS_LIST.map((s) => (
                <SelectItem key={s} value={s}>
                  {getWithdrawalStatusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            {teacherFilter ? (
              <span className="flex items-center gap-2">
                Giảng viên: <strong>{teacherFilter.label}</strong>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTeacherFilter(null);
                    setPage(1);
                  }}
                >
                  Bỏ lọc
                </Button>
              </span>
            ) : (
              "Bấm tên giảng viên trong bảng để lọc theo giảng viên đó."
            )}
          </div>
        </div>
      </section>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && items.length === 0}
        emptyTitle="Không có yêu cầu rút tiền nào"
        emptyDescription="Chưa có yêu cầu khớp bộ lọc hiện tại."
      >
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left">Giảng viên</th>
                  <th className="px-4 py-3 text-left">Số tiền</th>
                  <th className="px-4 py-3 text-left">Ngân hàng</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Ngày tạo</th>
                  <th className="px-4 py-3 text-left">Số dư hiện tại</th>
                  <th className="px-4 py-3 text-left">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((w) => {
                  const teacherBalance = Number(w.teacher_available_balance);
                  const isNegative = teacherBalance < 0;
                  return (
                    <tr key={w.id}>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="font-medium hover:underline"
                          title="Lọc theo giảng viên này"
                          onClick={() => {
                            setTeacherFilter({ id: w.teacher_id, label: w.teacher_name || w.teacher_email });
                            setPage(1);
                          }}
                        >
                          {w.teacher_name || w.teacher_email}
                        </button>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{w.teacher_email}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatWithdrawalAmount(w.amount)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {w.bank_name ? (
                          <>
                            <div>{w.bank_name}</div>
                            <div className="text-xs">
                              {w.bank_account_number} — {w.bank_account_name}
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getWithdrawalStatusVariant(w.status)}>
                          {getWithdrawalStatusLabel(w.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(w.created_at)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            isNegative
                              ? "flex items-center gap-1 font-medium text-red-600"
                              : "text-gray-600 dark:text-gray-400"
                          }
                        >
                          {isNegative && <AlertTriangle className="h-3.5 w-3.5" />}
                          {formatWithdrawalAmount(w.teacher_available_balance)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Can permission={PERMISSIONS.WALLET_WITHDRAWALS_MANAGE}>
                          <div className="flex flex-wrap gap-2">
                            {w.status === "pending" && (
                              <>
                                <Button size="sm" onClick={() => setApproveTarget(w)}>
                                  Duyệt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructiveGhost"
                                  onClick={() => setRejectTarget(w)}
                                >
                                  Từ chối
                                </Button>
                              </>
                            )}
                            {w.status === "approved" && (
                              <Button size="sm" onClick={() => setCompleteTarget(w)}>
                                Đánh dấu đã chuyển
                              </Button>
                            )}
                          </div>
                        </Can>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-1 text-sm text-gray-500">
            <span>
              Trang {data.page}/{data.total_pages} — {data.total_count} yêu cầu
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </QueryState>

      {/* Dialog duyệt — xác nhận ngắn */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent>
          <DialogTitle>Duyệt yêu cầu rút tiền?</DialogTitle>
          <DialogDescription>
            Giảng viên <strong>{approveTarget?.teacher_name || approveTarget?.teacher_email}</strong>{" "}
            — số tiền <strong>{approveTarget ? formatWithdrawalAmount(approveTarget.amount) : ""}</strong>.
            Sau khi duyệt, bạn cần tự chuyển khoản NGOÀI hệ thống rồi quay lại đánh dấu &quot;Đã chuyển&quot;.
          </DialogDescription>
          {approveTarget && Number(approveTarget.teacher_available_balance) < 0 && (
            // Quyết định #8: số dư âm do hoàn tiền sau khi đã rút — admin phải thấy cảnh báo trước
            // khi duyệt chi thêm tiền cho giảng viên này.
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Số dư hiện tại của giảng viên này đang âm (
                {formatWithdrawalAmount(approveTarget.teacher_available_balance)}). Cân nhắc từ chối
                yêu cầu này.
              </span>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveTarget(null)}>
              Huỷ
            </Button>
            <Button isLoading={approveMutation.isPending} onClick={confirmApprove}>
              Xác nhận duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog từ chối — bắt buộc nhập lý do */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && closeReject()}>
        <DialogContent>
          <DialogTitle>Từ chối yêu cầu rút tiền?</DialogTitle>
          <DialogDescription>
            Giảng viên <strong>{rejectTarget?.teacher_name || rejectTarget?.teacher_email}</strong>{" "}
            — số tiền <strong>{rejectTarget ? formatWithdrawalAmount(rejectTarget.amount) : ""}</strong>.
          </DialogDescription>
          <div className="mt-2">
            <label htmlFor="reject-reason" className="mb-1 block text-sm font-medium">
              Lý do từ chối <span className="text-red-600">*</span>
            </label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={REASON_MAX_LEN}
              rows={3}
              placeholder="Ví dụ: Thông tin ngân hàng không khớp hồ sơ giảng viên"
              className="w-full rounded-xl border border-slate-200 bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-border"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{rejectReason.length}/{REASON_MAX_LEN}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReject}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              isLoading={rejectMutation.isPending}
              onClick={confirmReject}
            >
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog đánh dấu đã chuyển — bắt buộc nhập mã giao dịch ngân hàng */}
      <Dialog open={!!completeTarget} onOpenChange={(open) => !open && closeComplete()}>
        <DialogContent>
          <DialogTitle>Đánh dấu đã chuyển khoản?</DialogTitle>
          <DialogDescription>
            Chỉ xác nhận SAU KHI đã thực sự chuyển khoản{" "}
            <strong>{completeTarget ? formatWithdrawalAmount(completeTarget.amount) : ""}</strong> cho{" "}
            <strong>{completeTarget?.teacher_name || completeTarget?.teacher_email}</strong>.
          </DialogDescription>
          <div className="mt-2">
            <label htmlFor="transaction-id" className="mb-1 block text-sm font-medium">
              Mã giao dịch ngân hàng <span className="text-red-600">*</span>
            </label>
            <Input
              id="transaction-id"
              placeholder="VD: FT2609271234"
              value={transactionIdInput}
              onChange={(e) => setTransactionIdInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeComplete}>
              Huỷ
            </Button>
            <Button
              disabled={!transactionIdInput.trim() || completeMutation.isPending}
              isLoading={completeMutation.isPending}
              onClick={confirmComplete}
            >
              Xác nhận đã chuyển
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
