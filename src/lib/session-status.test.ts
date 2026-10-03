import { describe, expect, it } from "vitest";
import { sessionStatusLabel } from "./session-status";

describe("sessionStatusLabel", () => {
  it("dịch các trạng thái backend trả sang tiếng Việt", () => {
    expect(sessionStatusLabel("scheduled")).toBe("Đã lên lịch");
    expect(sessionStatusLabel("live")).toBe("Đang diễn ra");
    expect(sessionStatusLabel("ended")).toBe("Đã kết thúc");
    expect(sessionStatusLabel("cancelled")).toBe("Đã huỷ");
  });

  it("vắng trạng thái coi như đã lên lịch (đúng mặc định cũ của trang)", () => {
    expect(sessionStatusLabel(undefined)).toBe("Đã lên lịch");
    expect(sessionStatusLabel(null)).toBe("Đã lên lịch");
  });

  it("mã lạ không bị in thô ra giao diện", () => {
    expect(sessionStatusLabel("weird_state")).toBe("Chưa rõ");
  });
});
