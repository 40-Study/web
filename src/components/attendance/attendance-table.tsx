"use client";

import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/services/session.service";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_META,
} from "./attendance-status-badge";
import type { AttendanceRow } from "./use-attendance-draft";

/** hh:mm từ ISO timestamp; rỗng nếu không có */
function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function AttendanceTable({
  rows,
  onStatusChange,
  onNoteChange,
  disabled,
}: {
  rows: AttendanceRow[];
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onNoteChange: (studentId: string, note: string) => void;
  disabled?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
        Lớp này chưa có học sinh nào.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Học sinh</th>
            <th className="px-4 py-3 font-medium">Trạng thái</th>
            <th className="px-4 py-3 font-medium">Check-in</th>
            <th className="px-4 py-3 font-medium">Ghi chú</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.studentId} className="hover:bg-gray-50/60">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{row.name}</p>
                {row.email && (
                  <p className="text-xs text-gray-500">{row.email}</p>
                )}
              </td>

              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {ATTENDANCE_STATUSES.map((status) => {
                    const meta = ATTENDANCE_STATUS_META[status];
                    const active = row.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={disabled}
                        onClick={() => onStatusChange(row.studentId, status)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                          active
                            ? meta.button
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </td>

              <td className="px-4 py-3 text-xs text-gray-600">
                {row.checkInTime ? (
                  <span>
                    {formatTime(row.checkInTime)}
                    {row.lateMinutes ? (
                      <span className="ml-1 text-amber-600">
                        (trễ {row.lateMinutes}′)
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>

              <td className="px-4 py-3">
                <input
                  type="text"
                  value={row.note ?? ""}
                  disabled={disabled}
                  onChange={(e) => onNoteChange(row.studentId, e.target.value)}
                  placeholder="Ghi chú…"
                  aria-label={`Ghi chú cho ${row.name}`}
                  className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-primary-500 disabled:bg-gray-50"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
