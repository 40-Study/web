import { formatVnDateThenTime } from "@/lib/vn-datetime";
import type { SessionAttendance } from "@/services/session.service";

/**
 * Cột "Thời gian" của một dòng điểm danh (QA7 S7-01, C15): giờ BẮT ĐẦU THEO LỊCH của buổi học, không phải lúc giáo
 * viên đánh dấu (vắng/có phép từng hiện giờ KẾT THÚC buổi). Dòng đi trễ giữ giờ vào lớp ở dòng phụ. Backend cũ chưa
 * trả `session_start_time` thì rơi về cách cũ (`check_in_time ?? created_at`) để trang không trống.
 */
export function AttendanceWhen({
  attendance: a,
}: {
  attendance: Pick<SessionAttendance, "session_start_time" | "check_in_time" | "created_at" | "status">;
}) {
  if (!a.session_start_time) return <>{formatVnDateThenTime(a.check_in_time ?? a.created_at)}</>;
  const showCheckIn = a.status === "late" && !!a.check_in_time;
  return (
    <>
      {formatVnDateThenTime(a.session_start_time)}
      {showCheckIn && (
        <span className="block text-xs text-gray-500">
          Vào lớp lúc {formatVnDateThenTime(a.check_in_time)}
        </span>
      )}
    </>
  );
}
