/**
 * Q5-T14 (contract C5): thêm/sửa lịch học hằng tuần trùng giờ với lớp khác còn hoạt động của chính giảng viên không
 * bị chặn, nhưng backend trả `warnings: [{ class_id, class_name, weekday, start_time, end_time }]`. Trước đây trùng
 * lịch chỉ lộ ra lúc "Sinh buổi học". Backend cũ không có trường này -> coi như không có cảnh báo.
 */
import { toTimeOfDay, weekdayLabel } from "@/lib/class-schedule-validation";

export interface ScheduleOverlapWarning {
  class_id: string;
  class_name: string;
  /** 0-6, Chủ nhật = 0 (cùng quy ước day_of_week của lịch). */
  weekday: number;
  start_time: string;
  end_time: string;
}

/** Chỉ giữ phần tử đủ trường (backend cũ / dữ liệu lạ không làm toast hiện "undefined"). */
export function scheduleWarningsFrom(value: unknown): ScheduleOverlapWarning[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (w): w is ScheduleOverlapWarning =>
      !!w && typeof w === "object" && typeof (w as ScheduleOverlapWarning).class_name === "string",
  );
}

/** "Trùng giờ với lớp "A" (Thứ hai 18:00–20:00); lớp "B" (Thứ tư 08:00–09:00)". */
export function scheduleOverlapSummary(warnings: readonly ScheduleOverlapWarning[]): string {
  const parts = warnings.map(
    (w) => `lớp "${w.class_name}" (${weekdayLabel(w.weekday)} ${toTimeOfDay(w.start_time)}–${toTimeOfDay(w.end_time)})`,
  );
  return `Trùng giờ với ${parts.join("; ")}. Lịch vẫn được lưu, hãy kiểm tra lại nếu không cố ý.`;
}
