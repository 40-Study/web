"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Error boundary cho route group (live) — phòng học trực tiếp. */
export default function LiveRouteError({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950 px-4 text-center text-white">
      <h2 className="text-2xl font-bold text-destructive">Đã xảy ra lỗi!</h2>
      <p className="max-w-md text-gray-400">
        Không tải được phòng học trực tiếp. Vui lòng thử lại — buổi học vẫn đang diễn ra.
      </p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
