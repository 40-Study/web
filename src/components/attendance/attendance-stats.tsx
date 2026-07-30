"use client";

import { cn } from "@/lib/utils";
import type { AttendanceStatus, SessionAttendance } from "@/services/session.service";
import { ATTENDANCE_STATUS_META } from "./attendance-status-badge";

/** Vắng vượt ngưỡng này thì cảnh báo (tỉ lệ trên tổng số buổi đã ghi nhận) */
export const ABSENCE_WARNING_RATIO = 0.2;

export interface AttendanceSummary {
  total: number;
  counts: Record<AttendanceStatus, number>;
  /** % có mặt, tính cả đi trễ vì HS vẫn tới lớp */
  presentRate: number;
  absenceRate: number;
  shouldWarn: boolean;
}

export function summarizeAttendances(
  attendances: SessionAttendance[]
): AttendanceSummary {
  const counts: Record<AttendanceStatus, number> = {
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
  };

  for (const a of attendances) counts[a.status] += 1;

  const total = attendances.length;
  const presentRate = total === 0 ? 0 : (counts.present + counts.late) / total;
  const absenceRate = total === 0 ? 0 : counts.absent / total;

  return {
    total,
    counts,
    presentRate,
    absenceRate,
    shouldWarn: total > 0 && absenceRate > ABSENCE_WARNING_RATIO,
  };
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-gray-200 p-4", className)}>
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export function AttendanceStats({ summary }: { summary: AttendanceSummary }) {
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Tỉ lệ tham dự" value={pct(summary.presentRate)} />
        <StatCard label="Tổng buổi" value={String(summary.total)} />
        <StatCard
          label={ATTENDANCE_STATUS_META.present.label}
          value={String(summary.counts.present)}
        />
        <StatCard
          label={ATTENDANCE_STATUS_META.late.label}
          value={String(summary.counts.late)}
        />
        <StatCard
          label={ATTENDANCE_STATUS_META.absent.label}
          value={String(summary.counts.absent)}
        />
      </div>

      {summary.shouldWarn && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Bạn đã vắng {pct(summary.absenceRate)} số buổi đã ghi nhận. Hãy liên hệ
          giáo viên nếu cần hỗ trợ.
        </p>
      )}
    </div>
  );
}
