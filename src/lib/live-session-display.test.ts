/**
 * A-08: danh sách buổi live của học viên. Ép TZ=UTC (giống CI): nếu helper bỏ `timeZone: "Asia/Ho_Chi_Minh"`
 * thì 19:00 VN hiện thành 12:00, tức lệch 7 giờ.
 */

import { describe, expect, it } from "vitest";
import type { LiveSession } from "@/services/live-session.service";
import { formatLiveDate, formatLiveTimeRange, groupLiveSessions, LIVE_STATUS_LABEL } from "./live-session-display";

process.env.TZ = "UTC";

function session(over: Partial<LiveSession>): LiveSession {
  return {
    id: over.id ?? "s",
    title: "t",
    description: "",
    host_id: "h",
    class_id: "c",
    room_name: "r",
    status: "scheduled",
    max_viewers: 100,
    is_recorded: false,
    settings: "{}",
    created_at: "2026-10-01T00:00:00+07:00",
    ...over,
  };
}

describe("giờ buổi live theo giờ Việt Nam", () => {
  it("19:00 +07:00 hiện 19:00, không phải 12:00", () => {
    expect(formatLiveTimeRange("2026-10-05T19:00:00+07:00", "2026-10-05T20:30:00+07:00")).toBe("19:00 – 20:30");
    expect(formatLiveTimeRange("2026-10-05T12:00:00Z")).toBe("19:00");
  });

  it("ngày hiển thị theo giờ VN: 00:30 +07:00 vẫn là ngày 05, không lùi về 04", () => {
    expect(formatLiveDate("2026-10-05T00:30:00+07:00")).toContain("05/10/2026");
  });

  it("thiếu hoặc rác thì trả chuỗi rỗng, không bao giờ 'Invalid Date'", () => {
    expect(formatLiveDate(undefined)).toBe("");
    expect(formatLiveTimeRange("không phải giờ")).toBe("");
  });
});

describe("groupLiveSessions", () => {
  it("chia live / sắp diễn ra / đã qua và sắp xếp đúng thứ tự", () => {
    const g = groupLiveSessions([
      session({ id: "late", status: "scheduled", scheduled_at: "2026-10-09T10:00:00+07:00" }),
      session({ id: "soon", status: "scheduled", scheduled_at: "2026-10-05T10:00:00+07:00" }),
      session({ id: "nodate", status: "scheduled" }),
      session({ id: "now", status: "live", scheduled_at: "2026-10-03T10:00:00+07:00" }),
      session({ id: "old", status: "ended", scheduled_at: "2026-09-01T10:00:00+07:00" }),
      session({ id: "recent", status: "ended", scheduled_at: "2026-09-20T10:00:00+07:00" }),
      session({ id: "cancel", status: "cancelled", scheduled_at: "2026-09-10T10:00:00+07:00" }),
    ]);
    expect(g.live.map((s) => s.id)).toEqual(["now"]);
    expect(g.upcoming.map((s) => s.id)).toEqual(["soon", "late", "nodate"]);
    expect(g.past.map((s) => s.id)).toEqual(["recent", "cancel", "old"]);
  });

  it("mọi trạng thái backend đều có nhãn tiếng Việt (không lộ 'scheduled/ended' thô)", () => {
    expect(LIVE_STATUS_LABEL).toEqual({
      scheduled: "Sắp diễn ra",
      live: "Đang trực tiếp",
      ended: "Đã kết thúc",
      cancelled: "Đã hủy",
    });
  });
});
