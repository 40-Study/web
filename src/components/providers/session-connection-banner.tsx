"use client";

import { Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionConnectionStore } from "@/lib/session-connection";

interface SessionConnectionBannerProps {
  onRetry: () => void;
  /** Bỏ phần chờ còn lại của lượt thử lại tự động đang chạy. */
  onRetryNow: () => void;
}

/**
 * Báo trung thực khi máy chủ chưa trả lời lúc khôi phục phiên (QA-B-01 / QA-C-02). Trong lúc này
 * trang được bảo vệ chưa hiện nội dung (phiên còn `checking`), nên banner nằm cố định trên cùng để
 * người dùng biết họ KHÔNG bị đăng xuất, chỉ đang chờ máy chủ.
 */
export function SessionConnectionBanner({ onRetry, onRetryNow }: SessionConnectionBannerProps) {
  const { state, attempt, maxAttempts, canRetryNow } = useSessionConnectionStore();
  if (state === "ok") return null;

  const isOffline = state === "offline";
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-3"
    >
      <div className="flex w-full max-w-xl items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-md dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
        {isOffline ? (
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {isOffline ? "Chưa kết nối được máy chủ" : "Mất kết nối tới máy chủ, đang thử lại…"}
          </p>
          <p className="mt-0.5 text-amber-800 dark:text-amber-200">
            {isOffline
              ? "Phiên đăng nhập vẫn được giữ. Kiểm tra mạng rồi bấm Thử lại."
              : `Phiên đăng nhập vẫn được giữ.${attempt > 0 ? ` Lần thử lại ${attempt}/${maxAttempts}.` : ""}`}
          </p>
        </div>
        {isOffline && (
          <Button size="sm" variant="outline" onClick={onRetry} className="shrink-0">
            Thử lại
          </Button>
        )}
        {!isOffline && canRetryNow && (
          <Button size="sm" variant="outline" onClick={onRetryNow} className="shrink-0">
            Thử lại ngay
          </Button>
        )}
      </div>
    </div>
  );
}
