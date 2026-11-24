"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useChildAttendancePages } from "@/hooks/queries/use-parent-dashboard";
import { formatCheckInTime } from "@/lib/format-check-in-time";
import { ChildAttendanceStatus } from "./child-attendance-status";

const PAGE_SIZE = 20;

/**
 * Tab "Điểm danh" của trang chi tiết con. Q5-PG-01: ô thống kê nay là số trên TOÀN BỘ buổi của con (backend,
 * contract C3; trước đây cộng trên trang đang tải nên "20 buổi" trong khi tổng là 65) và danh sách có
 * "Xem thêm" thay vì dừng ở 20 dòng mới nhất. Q5-PG-03: hiện giờ vào lớp khi có.
 */
export function ChildAttendanceTab({ childId }: { childId: string }) {
  const [pageCount, setPageCount] = useState(1);
  const { stats, total, records, isLoading, isFetchingMore, isError } = useChildAttendancePages(
    childId,
    pageCount,
    PAGE_SIZE,
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const canLoadMore = records.length < total && !isError;

  return (
    <div>
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Stat value={stats.total_sessions} label="Tổng buổi" tone="bg-gray-50" />
          <Stat value={stats.present_count} label="Có mặt" tone="bg-green-50 text-green-600" />
          <Stat value={stats.late_count} label="Trễ" tone="bg-yellow-50 text-yellow-600" />
          <Stat value={stats.absent_count} label="Vắng" tone="bg-red-50 text-red-600" />
          {/* P6: buổi nghỉ có phép phải có thẻ riêng, nếu không present+late+absent không bằng tổng. */}
          <Stat value={stats.excused_count} label="Có phép" tone="bg-blue-50 text-blue-600" />
          <Stat value={`${stats.attendance_rate.toFixed(0)}%`} label="Tỷ lệ" tone="bg-primary-50 text-primary-600" />
        </div>
      )}

      {records.length === 0 ? (
        <p className="text-center text-gray-500 py-4">Chưa có dữ liệu điểm danh</p>
      ) : (
        <ul className="space-y-2" data-testid="child-attendance-list">
          {records.map((record) => {
            const checkIn = formatCheckInTime(record.check_in_time);
            return (
              <li key={record.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{record.class_name}</p>
                  <p className="text-sm text-gray-500">
                    Buổi {record.session_number} - {new Date(record.date).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div className="text-right">
                  <ChildAttendanceStatus
                    status={record.status}
                    lateMinutes={record.late_minutes}
                    withIcon
                    className="text-sm"
                  />
                  {checkIn && <p className="text-xs text-gray-400">Vào lúc {checkIn}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isError && (
        <p className="mt-3 text-center text-sm text-red-600" role="alert">
          Không tải được dữ liệu điểm danh. Vui lòng thử lại sau.
        </p>
      )}

      {canLoadMore && (
        <div className="mt-4 flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => setPageCount((n) => n + 1)}
            disabled={isFetchingMore}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 disabled:opacity-60"
          >
            {isFetchingMore ? "Đang tải..." : "Xem thêm"}
          </button>
          <p className="text-xs text-gray-400">
            Đang hiện {records.length}/{total} buổi
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, tone }: { value: number | string; label: string; tone: string }) {
  return (
    <div className={`text-center p-3 rounded-lg ${tone}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
