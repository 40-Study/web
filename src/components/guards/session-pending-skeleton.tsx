import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeleton vùng nội dung trong lúc còn kiểm phiên (UX-B-01). Đặt trong khung trang (header,
 * sidebar) do layout truyền vào `RoleGuard.pendingFallback`, để người mở thẳng URL thấy trang
 * đang tải chứ không phải màn trắng.
 */
export function SessionPendingSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="Đang tải trang" className={cn("space-y-6", className)}>
      <span className="sr-only">Đang tải trang…</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 max-w-full" />
        <Skeleton variant="text" className="w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
