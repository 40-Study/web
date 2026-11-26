"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Nút "Thử lại" có trạng thái bận (Q8 #139 L7). Sau lỗi, `isLoading` của react-query vẫn false trong lúc refetch nên hộp
 * lỗi cứ đứng nguyên và bấm thử lại trông như không có gì xảy ra. `onRetry` trả Promise (vd. `() => refetch()`) thì nút
 * khoá và đổi nhãn tới khi Promise xong; trả void thì hành vi như cũ.
 */
export function RetryButton({
  onRetry,
  className,
  asLink = false,
}: {
  onRetry: () => unknown;
  className?: string;
  /** Kiểu liên kết gạch chân cho widget `compact`. */
  asLink?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onRetry();
    } catch {
      // Lỗi refetch hiện qua trạng thái của query, không cần xử lý thêm ở nút.
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const label = busy ? "Đang tải lại…" : "Thử lại";
  if (asLink) {
    return (
      <button type="button" onClick={handleClick} disabled={busy} aria-busy={busy} className={className}>
        {label}
      </button>
    );
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={busy} aria-busy={busy} className={className}>
      {label}
    </Button>
  );
}
