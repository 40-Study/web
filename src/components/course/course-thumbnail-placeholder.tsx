import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ảnh thay thế khi khoá học chưa có thumbnail (hoặc ảnh lỗi) — SSOT cho thẻ khoá học, giỏ hàng,
 * dropdown giỏ và thanh toán (F-16: trước đây giỏ hàng hiện khối gradient xanh khác hẳn thẻ khoá học).
 * Đặt trong khung `relative` có kích thước; component tự phủ kín khung.
 */
export function CourseThumbnailPlaceholder({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      data-testid="course-thumbnail-placeholder"
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800",
        className
      )}
    >
      <BookOpen
        className={cn("h-10 w-10 text-slate-300 dark:text-slate-600", iconClassName)}
        aria-hidden="true"
      />
    </div>
  );
}
