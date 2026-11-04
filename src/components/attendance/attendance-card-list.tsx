"use client";

import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/services/session.service";
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_META } from "./attendance-status-badge";
import type { AttendanceRow } from "./use-attendance-draft";

/** hh:mm từ ISO timestamp; rỗng nếu không có (cùng định dạng cột Check-in của AttendanceTable) */
function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Bố cục thẻ xếp dọc của bảng điểm danh cho màn hình hẹp (< md): bảng 720px làm nút trạng thái bị cắt ở 390px
 * (QA3 Q3-21). Cùng props với AttendanceTable; trang chọn bố cục bằng `md:hidden` / `hidden md:block`.
 */
export function AttendanceCardList({
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
    // Bảng bị ẩn dưới md nên thông báo rỗng phải có ở cả bố cục thẻ.
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
        Lớp này chưa có học sinh nào.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.studentId} className="space-y-3 rounded-lg border border-gray-200 p-3">
          <p className="font-medium text-gray-900">{row.name}</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Trạng thái của ${row.name}`}>
            {ATTENDANCE_STATUSES.map((status) => {
              const meta = ATTENDANCE_STATUS_META[status];
              return (
                <button
                  key={status}
                  type="button"
                  disabled={disabled}
                  onClick={() => onStatusChange(row.studentId, status)}
                  aria-pressed={row.status === status}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                    row.status === status ? meta.button : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
          {row.checkInTime && formatTime(row.checkInTime) && (
            <p className="text-xs text-gray-600">
              Check-in {formatTime(row.checkInTime)}
              {row.lateMinutes ? <span className="ml-1 text-amber-600">(trễ {row.lateMinutes}′)</span> : null}
            </p>
          )}
          <input
            type="text"
            value={row.note ?? ""}
            disabled={disabled}
            onChange={(e) => onNoteChange(row.studentId, e.target.value)}
            placeholder="Ghi chú…"
            aria-label={`Ghi chú cho ${row.name}`}
            className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-primary-500 disabled:bg-gray-50"
          />
        </li>
      ))}
    </ul>
  );
}
