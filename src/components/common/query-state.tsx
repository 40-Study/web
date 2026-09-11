"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface QueryStateProps {
  /** true khi query đang tải dữ liệu lần đầu */
  isLoading?: boolean;
  /** true khi query lỗi (API 500, mất mạng, …) */
  isError?: boolean;
  /** Lỗi trả về từ react-query, dùng để hiển thị thông điệp chi tiết nếu có */
  error?: unknown;
  /** true khi query thành công nhưng không có dữ liệu */
  isEmpty?: boolean;
  /** Gọi lại query khi người dùng bấm "Thử lại" */
  onRetry?: () => void;
  children: React.ReactNode;
  /** Skeleton tuỳ biến; mặc định là 3 khối chữ nhật */
  loadingFallback?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: React.ReactNode;
  className?: string;
}

// M-05: nhiều handler Go ở backend trả thẳng `err.Error()` làm `message` (lỗi
// SQL/GORM nội bộ) thay vì thông điệp đã Việt hoá cho người dùng — hiển thị
// nguyên `error.message` sẽ lộ chi tiết hệ thống. Không có field nào phân biệt
// "đã Việt hoá" hay "raw" trong response, nên dùng heuristic: lỗi nội bộ hầu
// như luôn thuần ASCII (không dấu tiếng Việt); chỉ tin message có dấu.
const HAS_VIETNAMESE_DIACRITICS = /[à-ỹÀ-Ỹ]/;

function getErrorMessage(error: unknown): string {
  const fallback = "Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.";
  const message =
    error instanceof Error && error.message
      ? error.message
      : typeof error === "string"
      ? error
      : "";
  return message && HAS_VIETNAMESE_DIACRITICS.test(message) ? message : fallback;
}

/**
 * QueryState — bọc chuẩn cho mọi query: loading / lỗi / rỗng / có dữ liệu.
 *
 * Trước khi có component này, lỗi API và "chưa có dữ liệu" render giống hệt
 * nhau (chỉ `isLoading` được xử lý ở hầu hết page) — người dùng không biết
 * nên chờ hay reload khi API trả lỗi. Dùng component này để mọi page có cùng
 * một hành vi: skeleton khi tải, thông báo lỗi kèm nút "Thử lại" khi lỗi,
 * empty-state khi rỗng.
 *
 * @example
 * const { data, isLoading, isError, error, refetch } = useSomeQuery();
 * <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} isEmpty={!data?.length}>
 *   <ItemList items={data} />
 * </QueryState>
 */
export function QueryState({
  isLoading,
  isError,
  error,
  isEmpty,
  onRetry,
  children,
  loadingFallback,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription = "Không tìm thấy nội dung nào ở đây.",
  className,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-3", className)} role="status" aria-live="polite">
        {loadingFallback ?? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        )}
        <span className="sr-only">Đang tải dữ liệu…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-red-200 bg-red-50/50 px-6 py-12 text-center dark:border-red-900/50 dark:bg-red-950/20",
          className
        )}
        role="alert"
      >
        <AlertCircle className="h-10 w-10 text-red-500" aria-hidden="true" />
        <div>
          <p className="font-medium text-red-700 dark:text-red-400">Không thể tải dữ liệu</p>
          <p className="mt-1 text-sm text-red-600/80 dark:text-red-400/70">{getErrorMessage(error)}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-gray-800",
          className
        )}
      >
        <p className="font-medium text-gray-700 dark:text-gray-200">{emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return <>{children}</>;
}
