"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InviteMembersResult } from "@/services/group.service";
import { rejectionReason } from "./rejection-reason";

interface InviteResultSummaryProps {
  result: InviteMembersResult;
  /** Tên hiển thị của một user id (tra từ danh sách vừa chọn; backend chỉ trả id). */
  nameOf: (userId: string) => string;
  onReselectRejected: () => void;
  onDone: () => void;
}

/**
 * Kết quả sau khi bấm "Mời": xanh cho người đã vào nhóm, vàng cho người bị từ chối kèm LÝ DO.
 * Không đóng dialog khi có người bị từ chối — người dùng phải thấy vì sao, không có kịch bản
 * "bấm Mời mà không có phản hồi".
 */
export function InviteResultSummary({ result, nameOf, onReselectRejected, onDone }: InviteResultSummaryProps) {
  const invited = result.invited.length;
  const rejected = result.rejected;

  return (
    <div className="space-y-4" aria-live="polite">
      {invited > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Đã thêm {invited} người vào nhóm</span>
        </div>
      )}

      {rejected.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="mb-2 flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {rejected.length} người chưa mời được
          </p>
          <ul className="space-y-1">
            {rejected.map((r) => (
              <li key={r.user_id}>
                <span className="font-medium">{nameOf(r.user_id)}</span>
                {", "}
                {rejectionReason(r.code)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {invited === 0 && rejected.length === 0 && (
        <p className="text-sm text-muted-foreground">Không có ai mới để mời.</p>
      )}

      <div className="flex justify-end gap-2">
        {rejected.length > 0 && (
          <Button variant="outline" onClick={onReselectRejected}>
            Chọn lại người bị từ chối
          </Button>
        )}
        <Button onClick={onDone}>Xong</Button>
      </div>
    </div>
  );
}
