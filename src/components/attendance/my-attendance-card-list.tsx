"use client";

/**
 * Lịch sử điểm danh của học viên dạng thẻ cho màn hẹp (< md). Bảng 4 cột ở 390px cắt mất cột "Ghi chú"
 * (QA4 S18); trang chọn bố cục bằng `md:hidden` / `hidden md:block` như bảng điểm danh của giảng viên.
 */

import { AttendanceWhen } from "./attendance-when";
import { AttendanceStatusBadge } from "./attendance-status-badge";
import { attendanceSessionLabel } from "@/lib/attendance-session-label";
import type { SessionAttendance } from "@/services/session.service";

export function MyAttendanceCardList({ attendances }: { attendances: SessionAttendance[] }) {
  return (
    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200" data-testid="my-attendance-cards">
      {attendances.map((a) => {
        const sessionLabel = attendanceSessionLabel(a);
        return (
        <li key={a.id} className="space-y-1.5 px-4 py-3 text-sm">
          {sessionLabel && <p className="break-words font-medium text-gray-900">{sessionLabel}</p>}
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-700"><AttendanceWhen attendance={a} /></span>
            <AttendanceStatusBadge status={a.status} />
          </div>
          {a.late_minutes ? <p className="text-gray-600">Trễ {a.late_minutes} phút</p> : null}
          {a.note ? <p className="break-words text-gray-600">Ghi chú: {a.note}</p> : null}
        </li>
        );
      })}
    </ul>
  );
}
