"use client";

import { RetryButton } from "@/components/common/retry-button";
import { cn } from "@/lib/utils";

/**
 * Thông báo gọn khi refetch nền lỗi nhưng dữ liệu cũ vẫn đang hiển thị (Q10-STU-01 / T-03 / PG-01 / ADMIN-01):
 * giữ dữ liệu trên màn hình, báo rõ là chưa cập nhật được và cho "Thử lại" — không nuốt lỗi âm thầm.
 * Dùng chung bởi `QueryState` (prop `hasData`) và các trang tự dựng nhánh lỗi.
 */
export function StaleDataNotice({
  onRetry,
  message = "Không cập nhật được dữ liệu mới. Đang hiển thị dữ liệu cũ.",
  className,
}: {
  onRetry?: () => unknown;
  message?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200",
        className
      )}
    >
      <span>{message}</span>
      {onRetry && <RetryButton onRetry={onRetry} />}
    </div>
  );
}
