"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary riêng cho route group (admin) (M-15) — giữ nguyên sidebar/
 * header quản trị thay vì rơi về error.tsx gốc (mất toàn bộ điều hướng admin).
 */
export default function AdminRouteError({
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-bold text-destructive">Đã xảy ra lỗi!</h2>
      <p className="max-w-md text-muted-foreground">
        Có lỗi xảy ra khi tải trang quản trị này. Vui lòng thử lại.
      </p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
