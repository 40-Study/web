import { describe, expect, it } from "vitest";
import { generateSessionsSummary } from "./generate-sessions-summary";

describe("generateSessionsSummary (Q4-T06)", () => {
  it("không bỏ buổi nào: câu cũ", () => {
    expect(generateSessionsSummary(2)).toBe("Đã tạo 2 buổi học");
    expect(generateSessionsSummary(2, [])).toBe("Đã tạo 2 buổi học");
  });

  it("nêu số buổi bỏ qua, lý do và ngày", () => {
    expect(generateSessionsSummary(1, [{ date: "2026-11-30", reason: "overlap" }])).toBe(
      "Đã tạo 1 buổi học, bỏ qua 1 buổi trùng lịch (30/11)",
    );
  });

  it("gom theo lý do", () => {
    expect(
      generateSessionsSummary(0, [
        { date: "2026-11-30", reason: "overlap" },
        { date: "2026-12-07", reason: "overlap" },
        { date: "2026-12-14", reason: "duplicate" },
      ]),
    ).toBe("Đã tạo 0 buổi học, bỏ qua 2 buổi trùng lịch (30/11, 07/12); 1 buổi đã tồn tại (14/12)");
  });
});
