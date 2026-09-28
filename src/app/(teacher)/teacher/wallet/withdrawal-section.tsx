"use client";

/**
 * Khối "Rút tiền" cho /teacher/wallet — TÁCH RIÊNG khỏi page.tsx (đang có lane khác sửa lỗi
 * hiển thị bảng giao dịch ở đó) để tránh đụng độ. Tự fetch dữ liệu qua các hook riêng
 * (react-query dedupe theo queryKey — không tốn thêm request nếu page.tsx đã gọi
 * useTeacherWallet() cùng lúc).
 */

import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Landmark, Loader2, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTeacherWallet, useMyWithdrawals, useCreateWithdrawal } from "@/hooks/queries/use-wallet";
import {
  formatWithdrawalAmount,
  getWithdrawalStatusLabel,
  getWithdrawalStatusVariant,
} from "@/lib/withdrawal-format";

const LIMIT = 10;

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString("vi-VN") : "—";
}

/** Mã rút gọn — 8 ký tự đầu của uuid, đủ để phân biệt trong 1 trang lịch sử. */
function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function WithdrawalSection() {
  const { data: wallet, isLoading: isWalletLoading, isError: isWalletError } = useTeacherWallet();
  const [page, setPage] = useState(1);
  const {
    data: history,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useMyWithdrawals({ page, limit: LIMIT });
  const createWithdrawal = useCreateWithdrawal();

  const [showDialog, setShowDialog] = useState(false);
  const [amountInput, setAmountInput] = useState("");

  const hasBankInfo = !!(wallet?.bank_name && wallet?.bank_account_number && wallet?.bank_account_name);
  const hasOpenWithdrawal = !!wallet?.has_open_withdrawal;
  const availableBalance = Number(wallet?.available_balance ?? 0);
  const minWithdrawal = Number(wallet?.min_withdrawal_amount ?? 0);
  const isNegativeBalance = availableBalance < 0;
  const isBelowMinimum = !isNegativeBalance && availableBalance < minWithdrawal;

  // Thứ tự ưu tiên lý do khoá nút theo đúng yêu cầu: thiếu bank info -> đang có yêu cầu mở ->
  // số dư âm -> dưới mức tối thiểu.
  let disableReason: string | null = null;
  if (isWalletError) {
    disableReason = "Không tải được thông tin ví, vui lòng tải lại trang.";
  } else if (isWalletLoading) {
    disableReason = null;
  } else if (!hasBankInfo) {
    disableReason = "Vui lòng thêm thông tin tài khoản ngân hàng ở trên trước khi rút tiền.";
  } else if (hasOpenWithdrawal) {
    disableReason = "Bạn đang có một yêu cầu rút tiền chưa xử lý xong.";
  } else if (isNegativeBalance) {
    disableReason =
      "Số dư của bạn đang âm — tạm thời không thể rút tiền tới khi có doanh thu mới bù lại.";
  } else if (isBelowMinimum) {
    disableReason = `Số dư khả dụng chưa đạt mức rút tối thiểu (${formatWithdrawalAmount(minWithdrawal)}).`;
  }

  const canRequestWithdrawal = disableReason === null && !isWalletLoading;

  const amountNumber = Number(amountInput);
  const isAmountEntered = amountInput.trim() !== "";
  const isAmountValid =
    isAmountEntered &&
    Number.isFinite(amountNumber) &&
    amountNumber >= minWithdrawal &&
    amountNumber <= availableBalance;
  const remainingAfterWithdrawal =
    isAmountEntered && Number.isFinite(amountNumber) ? availableBalance - amountNumber : availableBalance;

  function closeDialog() {
    setShowDialog(false);
    setAmountInput("");
  }

  function handleSubmit() {
    if (!isAmountValid) return;
    createWithdrawal.mutate(amountNumber, { onSuccess: closeDialog });
  }

  const items = history?.items ?? [];
  const totalPages = history?.total_pages ?? 1;

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Rút tiền</h2>
            <p className="text-sm text-muted-foreground">
              Yêu cầu chuyển thu nhập của bạn về tài khoản ngân hàng đã đăng ký.
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <Button
              disabled={!canRequestWithdrawal}
              onClick={() => setShowDialog(true)}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Yêu cầu rút tiền
            </Button>
            {disableReason && (
              <p className="max-w-xs text-right text-xs text-muted-foreground sm:text-right">
                {disableReason}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Cảnh báo số dư âm — hiển thị nổi bật, tách khỏi text giải thích cạnh nút */}
        {isNegativeBalance && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Số dư khả dụng của bạn đang{" "}
              <strong>{formatWithdrawalAmount(availableBalance)}</strong> (âm, do hoàn tiền sau khi
              đã rút). Yêu cầu rút tiền bị chặn tới khi doanh thu mới bù lại phần âm này.
            </span>
          </div>
        )}

        {/* Lịch sử yêu cầu rút */}
        {isHistoryLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isHistoryError ? (
          // Lỗi tải phải hiện là lỗi, không được rơi xuống nhánh "chưa có yêu cầu nào".
          <div className="flex flex-col items-center gap-2 p-6 text-sm text-red-600">
            <span>Không tải được lịch sử yêu cầu rút tiền.</span>
            <Button variant="outline" size="sm" onClick={() => refetchHistory()}>
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Bạn chưa có yêu cầu rút tiền nào.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3 text-xs font-medium text-muted-foreground">MÃ RÚT</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground text-right">SỐ TIỀN</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">TRẠNG THÁI</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">NGÀY TẠO</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">NGÀY XỬ LÝ</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">GHI CHÚ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((w) => (
                  <tr key={w.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3 text-sm font-medium">{shortId(w.id)}</td>
                    <td className="p-3 text-sm text-right font-medium">
                      {formatWithdrawalAmount(w.amount)}
                    </td>
                    <td className="p-3">
                      <Badge variant={getWithdrawalStatusVariant(w.status)}>
                        {getWithdrawalStatusLabel(w.status)}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{formatDate(w.created_at)}</td>
                    <td className="p-3 text-sm text-muted-foreground">{formatDate(w.processed_at)}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {w.status === "rejected" && w.rejection_reason
                        ? `Lý do từ chối: ${w.rejection_reason}`
                        : w.status === "completed" && w.transaction_id
                          ? `Mã GD: ${w.transaction_id}`
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        {items.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Trang {page}/{totalPages} · {history?.total_count ?? 0} yêu cầu
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Dialog yêu cầu rút tiền */}
      <Dialog open={showDialog} onOpenChange={(open) => (open ? setShowDialog(true) : closeDialog())}>
        <DialogContent>
          <DialogTitle>Yêu cầu rút tiền</DialogTitle>
          <DialogDescription>
            Số dư khả dụng: <strong>{formatWithdrawalAmount(availableBalance)}</strong> · Mức rút
            tối thiểu: <strong>{formatWithdrawalAmount(minWithdrawal)}</strong>
          </DialogDescription>

          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="withdrawal-amount" className="mb-1 block text-sm font-medium">
                Số tiền muốn rút <span className="text-red-600">*</span>
              </label>
              <Input
                id="withdrawal-amount"
                type="number"
                min={0}
                placeholder="Nhập số tiền muốn rút..."
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
              />
              {isAmountEntered && !isAmountValid && (
                <p className="mt-1 text-xs text-red-600">
                  {amountNumber < minWithdrawal
                    ? `Số tiền rút tối thiểu là ${formatWithdrawalAmount(minWithdrawal)}.`
                    : `Số tiền vượt quá số dư khả dụng (${formatWithdrawalAmount(availableBalance)}).`}
                </p>
              )}
            </div>

            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số dư còn lại sau khi rút</span>
                <span
                  className={`font-semibold ${remainingAfterWithdrawal < 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {formatWithdrawalAmount(remainingAfterWithdrawal)}
                </span>
              </div>
            </div>

            {hasBankInfo && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Landmark className="h-3.5 w-3.5" />
                Chuyển tới {wallet?.bank_name} — {wallet?.bank_account_name} (****
                {wallet?.bank_account_number?.slice(-4)})
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={createWithdrawal.isPending}>
              Hủy
            </Button>
            <Button
              disabled={!isAmountValid || createWithdrawal.isPending}
              isLoading={createWithdrawal.isPending}
              onClick={handleSubmit}
            >
              Xác nhận rút tiền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
