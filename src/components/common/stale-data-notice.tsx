"use client";

import { useEffect, useState } from "react";
import { RetryButton } from "@/components/common/retry-button";
import { cn } from "@/lib/utils";

export const DEFAULT_STALE_MESSAGE = "Không cập nhật được dữ liệu mới. Đang hiển thị dữ liệu cũ.";

/**
 * Thông báo gọn khi refetch nền lỗi nhưng dữ liệu cũ vẫn đang hiển thị (Q10-STU-01 / T-03 / PG-01 / ADMIN-01):
 * giữ dữ liệu trên màn hình, báo rõ là chưa cập nhật được và cho "Thử lại" — không nuốt lỗi âm thầm.
 * ĐÂY LÀ component duy nhất cho ca này (Q10 #148 M2): `QueryState` (prop `hasData`) và các trang tự dựng nhánh lỗi đều dùng nó.
 *
 * - `resourceLabel`: nêu rõ phần nào chưa làm mới được ("giỏ hàng", "khoá học"…); `message` ghi đè cả câu (vd. giải thích
 *   vì sao nút thanh toán đang khoá).
 * - Trang có nhiều query cùng lỗi chỉ dựng MỘT notice ở đầu trang (`staleQueries`), các `QueryState` bên trong truyền
 *   `showStaleNotice={false}` (Q10 #148 M3, tránh "bão" thông báo khi backend sập).
 * - Vùng `role="status"` được mount trước, chữ chỉ chèn vào sau lần mount đầu để trình đọc màn hình đọc ra (Q10 #148 L4).
 *   Vùng trống không có style nên không hiện gì trong frame đầu.
 */
export function StaleDataNotice({
  onRetry,
  resourceLabel,
  message,
  className,
  id,
}: {
  /** Nên trả Promise của refetch để nút "Thử lại" hiện trạng thái bận (RetryButton). */
  onRetry?: () => unknown;
  resourceLabel?: string;
  message?: string;
  className?: string;
  /** Để nút bị khoá trỏ `aria-describedby` tới lời giải thích (vd. nút thanh toán). */
  id?: string;
}) {
  const [announced, setAnnounced] = useState(false);
  useEffect(() => setAnnounced(true), []);

  const text =
    message ??
    (resourceLabel ? `Không làm mới được ${resourceLabel}, đang hiện dữ liệu đã tải trước đó.` : DEFAULT_STALE_MESSAGE);

  return (
    <div id={id} role="status" aria-live="polite" aria-atomic="true">
      {announced && (
        <div
          className={cn(
            "mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200",
            className
          )}
        >
          <span>{text}</span>
          {onRetry && <RetryButton onRetry={onRetry} />}
        </div>
      )}
    </div>
  );
}
