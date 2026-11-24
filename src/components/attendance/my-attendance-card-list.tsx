"use client";

/**
 * Lịch sử điểm danh của học viên dạng thẻ cho màn hẹp (< md). Bảng 4 cột ở 390px cắt mất cột "Ghi chú"
 * (QA4 S18); trang chọn bố cục bằng `md:hidden` / `hidden md:block` như bảng điểm danh của giảng viên.
 */

import { AttendanceStatusBadge } from "./attendance-status-badge";
import { formatVnDateThenTime } from "@/lib/vn-datetime";
import type { SessionAttendance } from "@/services/session.service";

export function MyAttendanceCardList({ attendances }: { attendances: SessionAttendance[] }) {
  return (
    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200" data-testid="my-attendance-cards">
      {attendances.map((a) => (
        <li key={a.id} className="space-y-1.5 px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-700">{formatVnDateThenTime(a.check_in_time ?? a.created_at)}</span>
            <AttendanceStatusBadge status={a.status} />
          </div>
          {a.late_minutes ? <p className="text-gray-600">Trễ {a.late_minutes} phút</p> : null}
          {a.note ? <p className="break-words text-gray-600">Ghi chú: {a.note}</p> : null}
        </li>
      ))}
    </ul>
  );
}
