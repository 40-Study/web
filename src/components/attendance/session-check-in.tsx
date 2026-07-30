"use client";

import { useCheckIn, useCheckOut } from "@/hooks/queries/use-sessions";
import { cn } from "@/lib/utils";

/**
 * Nút tự check-in/check-out cho một buổi học.
 *
 * Backend (schedule_service.go StudentCheckIn/StudentCheckOut):
 * - check-in là upsert: chưa có bản ghi thì tạo mới với status = "present";
 *   đã có thì chỉ cập nhật check_in_time.
 * - check-out BÁO LỖI nếu chưa từng check-in ("no check-in found").
 *   => nút check-out chỉ hiện sau khi đã check-in.
 *
 * Chưa có policy giới hạn thời gian/vị trí phía backend — xem câu hỏi mở
 * trong plan phase 03.
 */
export function SessionCheckIn({
  sessionId,
  checkedInAt,
  checkedOutAt,
  className,
}: {
  sessionId: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  className?: string;
}) {
  const checkIn = useCheckIn(sessionId);
  const checkOut = useCheckOut(sessionId);
  const busy = checkIn.isPending || checkOut.isPending;

  if (checkedOutAt) {
    return (
      <p className={cn("text-sm text-gray-500", className)}>
        Đã điểm danh xong buổi này.
      </p>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!checkedInAt ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => checkIn.mutate()}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {checkIn.isPending ? "Đang check-in…" : "Check-in"}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => checkOut.mutate()}
          className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {checkOut.isPending ? "Đang check-out…" : "Check-out"}
        </button>
      )}
    </div>
  );
}
