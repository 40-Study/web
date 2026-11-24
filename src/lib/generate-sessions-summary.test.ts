import { describe, expect, it } from "vitest";
import { allSkippedSummary, generateSessionsSummary, skippedFromErrorPayload } from "./generate-sessions-summary";

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

describe("lý do mới của backend#149", () => {
  it("cancelled: 'đã huỷ'; lý do lạ giữ nhãn chung", () => {
    expect(
      generateSessionsSummary(1, [
        { date: "2031-03-24", reason: "cancelled" },
        { date: "2031-03-31", reason: "holiday" },
      ]),
    ).toBe("Đã tạo 1 buổi học, bỏ qua 1 buổi đã huỷ (24/03); 1 buổi không tạo được (31/03)");
  });
});

describe("allSkippedSummary (409 mọi ngày bị bỏ qua)", () => {
  it("cùng một lý do: 'Tất cả N buổi ...'", () => {
    expect(
      allSkippedSummary([
        { date: "2031-03-03", reason: "duplicate" },
        { date: "2031-03-10", reason: "duplicate" },
      ]),
    ).toBe("Tất cả 2 buổi đã tồn tại (03/03, 10/03)");
  });

  it("nhiều lý do: liệt kê từng lý do", () => {
    expect(
      allSkippedSummary([
        { date: "2031-03-03", reason: "duplicate" },
        { date: "2031-03-10", reason: "overlap" },
        { date: "2031-03-24", reason: "cancelled" },
      ]),
    ).toBe("Không tạo được buổi nào: 1 buổi đã tồn tại (03/03); 1 buổi trùng lịch (10/03); 1 buổi đã huỷ (24/03)");
  });
});

describe("skippedFromErrorPayload", () => {
  it("đọc skipped[] hợp lệ, bỏ phần tử sai dạng; không có -> null", () => {
    expect(skippedFromErrorPayload({ skipped: [{ date: "2031-03-03", reason: "duplicate" }, { date: 1 }] })).toEqual([
      { date: "2031-03-03", reason: "duplicate" },
    ]);
    expect(skippedFromErrorPayload({ skipped: [] })).toBeNull();
    expect(skippedFromErrorPayload({ message: "x" })).toBeNull();
    expect(skippedFromErrorPayload(undefined)).toBeNull();
  });
});
