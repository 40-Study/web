import { describe, expect, it } from "vitest";
import type { ClassSession } from "@/services/session.service";
import { groupAttendanceSessions } from "./attendance-session-order";

const s = (id: string, date: string, status: ClassSession["status"] = "scheduled"): ClassSession => ({
  id,
  class_id: "c1",
  date,
  start_time: "19:00",
  end_time: "21:00",
  status,
});

// 10/11/2026 10:00 giờ Việt Nam.
const NOW = new Date("2026-11-10T03:00:00Z");

describe("groupAttendanceSessions (QA-B-09)", () => {
  it("chọn sẵn buổi gần nhất đã diễn ra, không phải buổi xa nhất trong tương lai", () => {
    const { defaultId } = groupAttendanceSessions(
      [s("b36", "2026-11-23"), s("b30", "2026-11-09"), s("b31", "2026-11-11"), s("b29", "2026-11-06")],
      NOW,
    );
    expect(defaultId).toBe("b30");
  });

  it("buổi hôm nay được chọn trước buổi hôm qua", () => {
    expect(groupAttendanceSessions([s("hqua", "2026-11-09"), s("homnay", "2026-11-10")], NOW).defaultId).toBe("homnay");
  });

  it("bỏ qua buổi đã huỷ khi chọn sẵn", () => {
    expect(
      groupAttendanceSessions([s("huy", "2026-11-09", "cancelled"), s("truoc", "2026-11-06")], NOW).defaultId,
    ).toBe("truoc");
  });

  it("lớp chưa dạy buổi nào: chọn buổi sắp tới gần nhất", () => {
    expect(groupAttendanceSessions([s("xa", "2026-11-23"), s("gan", "2026-11-11")], NOW).defaultId).toBe("gan");
  });

  it("tách nhóm: đã qua mới nhất trước, sắp tới sớm nhất trước", () => {
    const g = groupAttendanceSessions(
      [s("b36", "2026-11-23"), s("b30", "2026-11-09"), s("b31", "2026-11-11"), s("b29", "2026-11-06")],
      NOW,
    );
    expect(g.past.map((x) => x.id)).toEqual(["b30", "b29"]);
    expect(g.upcoming.map((x) => x.id)).toEqual(["b31", "b36"]);
  });

  it("đọc được date dạng ISO có giờ theo ngày Việt Nam", () => {
    // 2026-11-09T18:00:00Z là 01:00 ngày 10/11 giờ Việt Nam → tính là hôm nay.
    expect(groupAttendanceSessions([s("iso", "2026-11-09T18:00:00Z"), s("tuong-lai", "2026-11-12")], NOW).defaultId).toBe(
      "iso",
    );
  });
});
