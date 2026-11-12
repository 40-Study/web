import { CheckCircle, Clock, FileCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * QA-B-26: trạng thái điểm danh từng có ba cách tô khác nhau (trang chủ có màu, tab Tổng quan toàn xám, tab
 * Điểm danh thiếu icon cho "Có phép"). Một bảng dùng chung cho cả ba nơi.
 */
const ATTENDANCE_STATUS: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  present: { label: "Có mặt", className: "text-green-600 dark:text-green-400", icon: CheckCircle },
  late: { label: "Trễ", className: "text-amber-600 dark:text-amber-400", icon: Clock },
  absent: { label: "Vắng", className: "text-red-600 dark:text-red-400", icon: XCircle },
  excused: { label: "Có phép", className: "text-blue-600 dark:text-blue-400", icon: FileCheck },
};

export function ChildAttendanceStatus({
  status,
  lateMinutes,
  withIcon = false,
  className,
}: {
  status: string;
  lateMinutes?: number;
  withIcon?: boolean;
  className?: string;
}) {
  const meta = ATTENDANCE_STATUS[status];
  if (!meta) return <span className={cn("text-muted-foreground", className)}>{status}</span>;
  const Icon = meta.icon;
  const label = status === "late" && lateMinutes ? `${meta.label} ${lateMinutes} phút` : meta.label;
  return (
    <span className={cn("inline-flex items-center gap-1", meta.className, className)}>
      {withIcon && <Icon className="h-4 w-4" aria-hidden />}
      {label}
    </span>
  );
}
