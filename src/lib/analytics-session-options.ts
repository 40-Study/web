/**
 * Q3-24: trang Thống kê phiên học từng bắt giảng viên gõ tay Session ID. Danh sách chọn gồm các buổi có số liệu
 * để xem — đang trực tiếp và đã kết thúc (buổi sắp diễn ra/đã huỷ chưa có người xem nên không đưa vào).
 */

import type { LiveSession } from "@/services/live-session.service";
import { LIVE_STATUS_LABEL, formatLiveDate, formatLiveTimeRange, groupLiveSessions } from "./live-session-display";

export interface AnalyticsSessionOption {
  value: string;
  label: string;
}

function labelOf(session: LiveSession): string {
  const when = session.scheduled_at ?? session.started_at ?? session.created_at;
  const parts = [
    session.title.trim() || "Buổi học không tên",
    [formatLiveDate(when), formatLiveTimeRange(when, session.scheduled_end_at ?? session.ended_at)]
      .filter(Boolean)
      .join(" "),
    session.status === "live" ? LIVE_STATUS_LABEL.live : "",
  ];
  return parts.filter(Boolean).join(" · ");
}

/** Buổi đang live trước, rồi các buổi đã kết thúc mới nhất trước. */
export function toAnalyticsSessionOptions(sessions: readonly LiveSession[]): AnalyticsSessionOption[] {
  const { live, past } = groupLiveSessions([...sessions]);
  return [...live, ...past.filter((s) => s.status === "ended")].map((s) => ({ value: s.id, label: labelOf(s) }));
}
