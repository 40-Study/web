"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary cho route group (lesson) — trình học của học viên.
 *
 * Microcopy trấn an: lỗi tải trang KHÔNG làm mất tiến trình đã lưu, nên nói rõ
 * điều đó thay vì chỉ báo "đã xảy ra lỗi" (học viên dễ tưởng mất bài).
 */
export default function LessonRouteError({
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
        Không tải được nội dung bài học. Tiến trình học của bạn không bị ảnh hưởng —
        vui lòng thử lại.
      </p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
