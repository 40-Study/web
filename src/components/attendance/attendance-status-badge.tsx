"use client";

import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/services/session.service";

/** Nhãn + màu cho 4 trạng thái backend (model.AttendanceStatus) */
export const ATTENDANCE_STATUS_META: Record<
  AttendanceStatus,
  { label: string; badge: string; button: string }
> = {
  present: {
    label: "Có mặt",
    badge: "bg-green-100 text-green-700 border-green-200",
    button: "bg-green-600 text-white border-green-600",
  },
  late: {
    label: "Đi trễ",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    button: "bg-amber-500 text-white border-amber-500",
  },
  absent: {
    label: "Vắng",
    badge: "bg-red-100 text-red-700 border-red-200",
    button: "bg-red-600 text-white border-red-600",
  },
  excused: {
    label: "Có phép",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    button: "bg-blue-600 text-white border-blue-600",
  },
};

/** Thứ tự hiển thị nút trong bảng điểm danh */
export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "present",
  "late",
  "absent",
  "excused",
];

export function AttendanceStatusBadge({
  status,
  className,
}: {
  status: AttendanceStatus;
  className?: string;
}) {
  const meta = ATTENDANCE_STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.badge,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
