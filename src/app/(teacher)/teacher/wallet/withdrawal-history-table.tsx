"use client";

/**
 * Bảng lịch sử yêu cầu rút tiền của giảng viên + nút "Huỷ yêu cầu" (QA vòng 2, Q2).
 *
 * Chỉ yêu cầu còn `pending` mới có nút huỷ: đã duyệt nghĩa là admin đang chuyển khoản, backend
 * trả 409 nếu cố huỷ. Huỷ có hộp xác nhận vì không hoàn tác được (muốn rút lại thì gửi yêu cầu mới).
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCancelWithdrawal } from "@/hooks/queries/use-wallet";
import {
  formatWithdrawalAmount,
  getWithdrawalStatusLabel,
  getWithdrawalStatusVariant,
} from "@/lib/withdrawal-format";
import type { WithdrawalItem } from "@/services/wallet.service";

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString("vi-VN") : "—";
}

/** Mã rút gọn — 8 ký tự đầu của uuid, đủ để phân biệt trong 1 trang lịch sử. */
function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function noteFor(w: WithdrawalItem): string {
  if (w.status === "rejected" && w.rejection_reason) return `Lý do từ chối: ${w.rejection_reason}`;
  if (w.status === "completed" && w.transaction_id) return `Mã GD: ${w.transaction_id}`;
  if (w.status === "cancelled") return "Bạn đã huỷ yêu cầu này";
  return "—";
}

export function WithdrawalHistoryTable({ items }: { items: WithdrawalItem[] }) {
  const cancelWithdrawal = useCancelWithdrawal();
  const [confirming, setConfirming] = useState<WithdrawalItem | null>(null);

  function confirmCancel() {
    if (!confirming) return;
    // Đóng hộp thoại cả khi lỗi: hook đã báo lỗi + làm mới danh sách để hiện trạng thái thật.
    cancelWithdrawal.mutate(confirming.id, { onSettled: () => setConfirming(null) });
  }

  return (
    <>
      {/* relative: nhãn sr-only (position:absolute) ở cột thao tác phải bị khung cuộn chứa, nếu không nó kéo giãn cả trang ở 390px. */}
      <div className="relative overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3 text-xs font-medium text-muted-foreground">MÃ RÚT</th>
              <th className="p-3 text-xs font-medium text-muted-foreground text-right">SỐ TIỀN</th>
              <th className="p-3 text-xs font-medium text-muted-foreground">TRẠNG THÁI</th>
              <th className="p-3 text-xs font-medium text-muted-foreground">NGÀY TẠO</th>
              <th className="p-3 text-xs font-medium text-muted-foreground">NGÀY XỬ LÝ</th>
              <th className="p-3 text-xs font-medium text-muted-foreground">GHI CHÚ</th>
              <th className="p-3 text-xs font-medium text-muted-foreground">
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr key={w.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-3 text-sm font-medium">{shortId(w.id)}</td>
                <td className="p-3 text-sm text-right font-medium">{formatWithdrawalAmount(w.amount)}</td>
                <td className="p-3">
                  <Badge variant={getWithdrawalStatusVariant(w.status)}>{getWithdrawalStatusLabel(w.status)}</Badge>
                </td>
                <td className="p-3 text-sm text-muted-foreground">{formatDate(w.created_at)}</td>
                <td className="p-3 text-sm text-muted-foreground">{formatDate(w.processed_at)}</td>
                <td className="p-3 text-sm text-muted-foreground">{noteFor(w)}</td>
                <td className="p-3 text-right">
                  {w.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirming(w)}
                      data-testid={`cancel-withdrawal-${w.id}`}
                    >
                      Huỷ yêu cầu
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!confirming} onOpenChange={(open) => !open && !cancelWithdrawal.isPending && setConfirming(null)}>
        <DialogContent>
          <DialogTitle>Huỷ yêu cầu rút tiền?</DialogTitle>
          <DialogDescription>
            Yêu cầu <strong>{confirming ? shortId(confirming.id) : ""}</strong> —{" "}
            <strong>{confirming ? formatWithdrawalAmount(confirming.amount) : ""}</strong> sẽ bị huỷ và số
            tiền được trả lại vào số dư khả dụng. Bạn có thể gửi yêu cầu mới sau đó.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)} disabled={cancelWithdrawal.isPending}>
              Giữ yêu cầu
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
              isLoading={cancelWithdrawal.isPending}
              disabled={cancelWithdrawal.isPending}
            >
              Xác nhận huỷ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
