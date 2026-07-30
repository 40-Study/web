"use client";

import { useMemo, useState } from "react";
import {
  AttendanceStats,
  summarizeAttendances,
} from "@/components/attendance/attendance-stats";
import { AttendanceStatusBadge } from "@/components/attendance/attendance-status-badge";
import { useMyAttendances } from "@/hooks/queries/use-sessions";

/** Backend ép page_size tối đa 50 (schedule_service.go GetMyAttendances) */
const PAGE_SIZE = 20;

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("vi-VN");
}

export default function MyAttendancePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyAttendances({
    page,
    page_size: PAGE_SIZE,
  });

  const attendances = useMemo(() => data?.attendances ?? [], [data]);
  const summary = useMemo(
    () => summarizeAttendances(attendances),
    [attendances]
  );

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Chuyên cần</h1>
        <p className="mt-1 text-sm text-gray-500">
          Lịch sử điểm danh các buổi học của bạn.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500">
          Đang tải…
        </div>
      ) : attendances.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          Chưa có buổi học nào được điểm danh.
        </div>
      ) : (
        <>
          {/* Thống kê tính trên TRANG hiện tại, không phải toàn bộ lịch sử */}
          <AttendanceStats summary={summary} />
          {totalPages > 1 && (
            <p className="mt-2 text-xs text-gray-500">
              Thống kê tính trên {attendances.length} buổi đang hiển thị (tổng{" "}
              {total} buổi).
            </p>
          )}

          <div className="mt-5 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Thời gian</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Trễ</th>
                  <th className="px-4 py-3 font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendances.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-700">
                      {formatDateTime(a.check_in_time ?? a.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceStatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {a.late_minutes ? `${a.late_minutes}′` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-gray-500">
                Trang {page}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
