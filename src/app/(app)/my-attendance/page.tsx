"use client";

import { useMemo, useState } from "react";
import {
  AttendanceStats,
  summarizeAttendances,
} from "@/components/attendance/attendance-stats";
import { AttendanceStatusBadge } from "@/components/attendance/attendance-status-badge";
import { useAllMyAttendances, useMyAttendances } from "@/hooks/queries/use-sessions";
import { formatVnDateThenTime } from "@/lib/vn-datetime";

/** Backend ép page_size tối đa 50 (schedule_service.go GetMyAttendances) */
const PAGE_SIZE = 20;

export default function MyAttendancePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyAttendances({
    page,
    page_size: PAGE_SIZE,
  });
  // S3: thống kê đầu trang phải phủ TOÀN BỘ lịch sử, không chỉ 20 dòng của trang hiện tại.
  const { data: allAttendances, isLoading: isLoadingAll } = useAllMyAttendances();

  const attendances = useMemo(() => data?.attendances ?? [], [data]);
  const summary = useMemo(
    () => summarizeAttendances(allAttendances ?? []),
    [allAttendances]
  );

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Chuyên cần</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lịch sử điểm danh các buổi học của bạn.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          Đang tải…
        </div>
      ) : attendances.length === 0 ? (
        <div className="rounded-lg border border-dashed border-input p-8 text-center text-sm text-muted-foreground">
          Chưa có buổi học nào được điểm danh.
        </div>
      ) : (
        <>
          {/* S3: số liệu tính trên TOÀN BỘ lịch sử (không phải chỉ trang đang xem). */}
          <AttendanceStats summary={summary} />
          {isLoadingAll && (
            <p className="mt-2 text-xs text-muted-foreground">
              Đang tổng hợp toàn bộ lịch sử…
            </p>
          )}

          <div className="mt-5 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Thời gian</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Trễ</th>
                  <th className="px-4 py-3 font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendances.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/50">
                    {/* S11: formatter chung (giờ VN, bỏ giây); F-18: ngày trước, giờ sau. */}
                    <td className="px-4 py-3 text-foreground">
                      {formatVnDateThenTime(a.check_in_time ?? a.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceStatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.late_minutes ? `${a.late_minutes}′` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.note || "—"}</td>
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
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted/50 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-muted-foreground">
                Trang {page}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted/50 disabled:opacity-50"
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
