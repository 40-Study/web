"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useChildAttendancePages } from "@/hooks/queries/use-parent-dashboard";
import { formatCheckInTime } from "@/lib/format-check-in-time";
import { ChildAttendanceStatus } from "./child-attendance-status";
import { formatVnDate } from "@/lib/vn-datetime";

const PAGE_SIZE = 20;

/**
 * Tab "Điểm danh" của trang chi tiết con. Q5-PG-01: ô thống kê nay là số trên TOÀN BỘ buổi của con (backend,
 * contract C3; trước đây cộng trên trang đang tải nên "20 buổi" trong khi tổng là 65) và danh sách có
 * "Xem thêm" thay vì dừng ở 20 dòng mới nhất. Q5-PG-03: hiện giờ vào lớp khi có.
 */
export function ChildAttendanceTab({ childId }: { childId: string }) {
  const [pageCount, setPageCount] = useState(1);
  const { stats, total, records, isLoading, isFetchingMore, isError, retry } = useChildAttendancePages(
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

  // Trang sau lỗi vẫn giữ nút (thành "Thử lại" tải lại đúng trang hỏng); trang 1 lỗi không có total nên nút
  // "Thử lại" hiện theo `isError` chứ không theo `canLoadMore` (Q9-PG-04).
  const canLoadMore = records.length < total;

  return (
    <div>
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Stat value={stats.total_sessions} label="Tổng buổi" tone="bg-gray-50" />
          <Stat value={stats.present_count} label="Có mặt" tone="bg-green-50 text-green-700" />
          <Stat value={stats.late_count} label="Trễ" tone="bg-yellow-50 text-yellow-700" />
          <Stat value={stats.absent_count} label="Vắng" tone="bg-red-50 text-red-700" />
          {/* P6: buổi nghỉ có phép phải có thẻ riêng, nếu không present+late+absent không bằng tổng. */}
          <Stat value={stats.excused_count} label="Có phép" tone="bg-blue-50 text-blue-600" />
          <Stat value={`${stats.attendance_rate.toFixed(0)}%`} label="Tỷ lệ" tone="bg-primary-50 text-primary-600" />
        </div>
      )}

      {records.length === 0 ? (
        // Trang 1 lỗi không có nghĩa là "chưa có dữ liệu": chỉ hiện câu lỗi bên dưới, không hiện cả hai.
        !isError && <p className="text-center text-gray-500 py-4">Chưa có dữ liệu điểm danh</p>
      ) : (
        <ul className="space-y-2" data-testid="child-attendance-list">
          {records.map((record) => {
            const checkIn = formatCheckInTime(record.check_in_time);
            return (
              <li key={record.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border">
                <div className="min-w-0">
                  <p className="font-medium">{record.class_name}</p>
                  <p className="text-sm text-gray-500">
                    Buổi {record.session_number} - {formatVnDate(record.date)}
                  </p>
                </div>
                {/* Q6-PG-09: cột phải không co/không bẻ dòng ("Vào lúc 08:30", "Trễ 12 phút" ở 390px); tên lớp bên trái là phần xuống dòng. */}
                <div className="shrink-0 whitespace-nowrap text-right" data-testid="attendance-status-block">
                  <ChildAttendanceStatus
                    status={record.status}
                    lateMinutes={record.late_minutes}
                    withIcon
                    className="text-sm"
                  />
                  {checkIn && <p className="text-xs text-gray-500">Vào lúc {checkIn}</p>}
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

      {/* Q9-PG-04: trang 1 lỗi thì total = 0 nên canLoadMore sai; nút "Thử lại" phải hiện mỗi khi có lỗi. */}
      {(canLoadMore || isError) && (
        <div className="mt-4 flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => (isError ? retry() : setPageCount((n) => n + 1))}
            disabled={isFetchingMore}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 disabled:opacity-60"
          >
            {isFetchingMore ? "Đang tải..." : isError ? "Thử lại" : "Xem thêm"}
          </button>
          {total > 0 && (
            <p className="text-xs text-gray-500">
              Đang hiện {records.length}/{total} buổi
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, tone }: { value: number | string; label: string; tone: string }) {
  return (
    <div className={`text-center p-3 rounded-lg ${tone}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}
