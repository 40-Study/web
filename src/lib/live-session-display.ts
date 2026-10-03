/**
 * Hiển thị buổi học trực tiếp cho học viên (A-08): nhãn trạng thái tiếng Việt, giờ Việt Nam cố định,
 * và chia danh sách thành "đang live / sắp diễn ra / đã kết thúc".
 *
 * Giờ luôn hiển thị theo Asia/Ho_Chi_Minh thay vì múi giờ trình duyệt: backend trả RFC3339 có offset
 * +07:00, người xem ở máy khác múi giờ vẫn phải thấy đúng giờ học đã công bố (không lệch 7 giờ).
 */

import type { LiveSession, LiveSessionStatus } from "@/services/live-session.service";

const TIME_ZONE = "Asia/Ho_Chi_Minh";

export const LIVE_STATUS_LABEL: Record<LiveSessionStatus, string> = {
  scheduled: "Sắp diễn ra",
  live: "Đang trực tiếp",
  ended: "Đã kết thúc",
  cancelled: "Đã hủy",
};

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "T2, 05/10/2026"; chuỗi rỗng khi không có/không đọc được giờ. */
export function formatLiveDate(iso: string | null | undefined): string {
  const d = parse(iso);
  if (!d) return "";
  return d.toLocaleDateString("vi-VN", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function clock(d: Date): string {
  return d.toLocaleTimeString("vi-VN", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false });
}

/** "19:00 – 20:30", hoặc chỉ "19:00" khi buổi không có giờ kết thúc dự kiến. */
export function formatLiveTimeRange(start: string | null | undefined, end?: string | null): string {
  const s = parse(start);
  if (!s) return "";
  const e = parse(end);
  return e ? `${clock(s)} – ${clock(e)}` : clock(s);
}

export interface LiveSessionGroups {
  live: LiveSession[];
  upcoming: LiveSession[];
  past: LiveSession[];
}

function startMs(s: LiveSession): number {
  return parse(s.scheduled_at ?? s.started_at ?? s.created_at)?.getTime() ?? 0;
}

/**
 * Chia và sắp xếp: đang live trước; sắp diễn ra theo giờ tăng dần (không có lịch thì xuống cuối);
 * đã kết thúc/đã huỷ mới nhất trước.
 */
export function groupLiveSessions(sessions: LiveSession[]): LiveSessionGroups {
  const live = sessions.filter((s) => s.status === "live");
  const upcoming = sessions
    .filter((s) => s.status === "scheduled")
    .sort((a, b) => {
      if (!a.scheduled_at && !b.scheduled_at) return 0;
      if (!a.scheduled_at) return 1;
      if (!b.scheduled_at) return -1;
      return startMs(a) - startMs(b);
    });
  const past = sessions
    .filter((s) => s.status === "ended" || s.status === "cancelled")
    .sort((a, b) => startMs(b) - startMs(a));
  return { live, upcoming, past };
}
