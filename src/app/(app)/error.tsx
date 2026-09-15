"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary cho route group (app) — giữ nguyên AppShell (sidebar/header)
 * khi một page con lỗi, thay vì rơi về error.tsx gốc và mất toàn bộ layout.
 */
export default function AppRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-bold text-destructive">Đã xảy ra lỗi!</h2>
      <p className="max-w-md text-muted-foreground">
        Có lỗi xảy ra khi tải trang này. Vui lòng thử lại hoặc quay về trang chủ.
      </p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
