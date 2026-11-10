import type { ClassSession } from "@/services/session.service";

const VN_DAY_KEY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" theo giờ Việt Nam. `date` của buổi học là ngày thuần, hoặc ISO có giờ (backend cũ). */
function dayKey(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value.slice(0, 10) : VN_DAY_KEY.format(d);
}

export interface AttendanceSessionGroups {
  /** Buổi hôm nay và đã qua, gần nhất trước. */
  past: ClassSession[];
  /** Buổi sau hôm nay, sớm nhất trước. */
  upcoming: ClassSession[];
  /** Buổi chọn sẵn khi mở trang. */
  defaultId: string;
}

/**
 * QA-B-09: trang điểm danh từng chọn sẵn buổi XA NHẤT trong tương lai (23/11, buổi 36) vì danh sách xếp
 * mới→cũ rồi lấy phần tử đầu; giảng viên dễ điểm danh nhầm buổi. Giảng viên điểm danh buổi vừa dạy, nên chọn
 * sẵn buổi gần nhất đã diễn ra (tính cả hôm nay), bỏ qua buổi đã huỷ. Lớp chưa dạy buổi nào thì chọn buổi
 * sắp tới gần nhất.
 */
export function groupAttendanceSessions(sessions: ClassSession[], now: Date = new Date()): AttendanceSessionGroups {
  const today = VN_DAY_KEY.format(now);
  const keyed = sessions.map((s) => ({ s, key: `${dayKey(s.date)} ${s.start_time ?? ""}` }));
  const past = keyed
    .filter(({ key }) => key.slice(0, 10) <= today)
    .sort((a, b) => b.key.localeCompare(a.key))
    .map(({ s }) => s);
  const upcoming = keyed
    .filter(({ key }) => key.slice(0, 10) > today)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ s }) => s);
  const pick =
    past.find((s) => s.status !== "cancelled") ??
    upcoming.find((s) => s.status !== "cancelled") ??
    past[0] ??
    upcoming[0];
  return { past, upcoming, defaultId: pick?.id ?? "" };
}
