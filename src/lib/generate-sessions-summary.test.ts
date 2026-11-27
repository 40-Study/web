import { describe, expect, it } from "vitest";
import { allSkippedSummary, generateSessionsSummary, skippedFromErrorPayload } from "./generate-sessions-summary";

describe("generateSessionsSummary (Q4-T06)", () => {
  it("không bỏ buổi nào: câu cũ", () => {
    expect(generateSessionsSummary(2)).toBe("Đã tạo 2 buổi học");
    expect(generateSessionsSummary(2, [])).toBe("Đã tạo 2 buổi học");
  });

  it("nêu số buổi bỏ qua, lý do và ngày", () => {
    expect(generateSessionsSummary(1, [{ date: "2026-11-30", reason: "overlap" }])).toBe(
      "Đã tạo 1 buổi học. Bỏ qua 1 ngày trùng lịch: 30/11",
    );
  });

  it("gom theo lý do", () => {
    expect(
      generateSessionsSummary(0, [
        { date: "2026-11-30", reason: "overlap" },
        { date: "2026-12-07", reason: "overlap" },
        { date: "2026-12-14", reason: "duplicate" },
      ]),
    ).toBe("Đã tạo 0 buổi học. Bỏ qua 2 ngày trùng lịch: 30/11, 07/12; 1 ngày đã tồn tại: 14/12");
  });
});

describe("lý do mới của backend#149", () => {
  it("cancelled: 'đã huỷ'; lý do lạ giữ nhãn chung", () => {
    expect(
      generateSessionsSummary(1, [
        { date: "2031-03-24", reason: "cancelled" },
        { date: "2031-03-31", reason: "holiday" },
      ]),
    ).toBe("Đã tạo 1 buổi học. Bỏ qua 1 ngày đã huỷ: 24/03; 1 ngày (không rõ lý do): 31/03");
  });
});

describe("allSkippedSummary (409 mọi ngày bị bỏ qua)", () => {
  it("cùng một lý do: 'Tất cả N buổi ...'", () => {
    expect(
      allSkippedSummary([
        { date: "2031-03-03", reason: "duplicate" },
        { date: "2031-03-10", reason: "duplicate" },
      ]),
    ).toBe("Bỏ qua tất cả 2 ngày đã tồn tại: 03/03, 10/03");
  });

  it("nhiều lý do: liệt kê từng lý do", () => {
    expect(
      allSkippedSummary([
        { date: "2031-03-03", reason: "duplicate" },
        { date: "2031-03-10", reason: "overlap" },
        { date: "2031-03-24", reason: "cancelled" },
      ]),
    ).toBe("Không tạo được buổi nào. Bỏ qua 1 ngày đã tồn tại: 03/03; 1 ngày trùng lịch: 10/03; 1 ngày đã huỷ: 24/03");
  });
});

describe("Q9-T-07: tóm tắt ngắn, không liệt kê hết", () => {
  // Báo cáo QA9: 104 buổi trùng lịch từng thành một toast ~500 ký tự liệt kê mọi ngày.
  const overlap = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ date: `2031-${String(Math.floor(i / 28) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`, reason: "overlap" }));

  it("409 mọi ngày bị bỏ qua: số ngày + 3 ngày đầu + (+N)", () => {
    const text = allSkippedSummary(overlap(104));
    expect(text).toBe("Bỏ qua tất cả 104 ngày trùng lịch: 01/01, 02/01, 03/01 (+101)");
    expect(text.length).toBeLessThan(80);
  });

  it("thành công một phần (77 tạo, 27 bỏ qua): cũng chỉ tóm tắt", () => {
    expect(generateSessionsSummary(77, overlap(27))).toBe("Đã tạo 77 buổi học. Bỏ qua 27 ngày trùng lịch: 01/01, 02/01, 03/01 (+24)");
  });

  it("đúng 3 ngày: liệt kê hết, không có (+0)", () => {
    expect(generateSessionsSummary(1, overlap(3))).toBe("Đã tạo 1 buổi học. Bỏ qua 3 ngày trùng lịch: 01/01, 02/01, 03/01");
  });

  it("nhiều lý do: mỗi lý do có giới hạn riêng", () => {
    expect(
      allSkippedSummary([...overlap(5), { date: "2031-03-03", reason: "duplicate" }]),
    ).toBe("Không tạo được buổi nào. Bỏ qua 5 ngày trùng lịch: 01/01, 02/01, 03/01 (+2); 1 ngày đã tồn tại: 03/03");
  });
});

describe("Q9 review L2/L4", () => {
  it("L2: ngày bỏ qua được sắp tăng dần trước khi lấy 3 ngày đầu, dù backend trả lộn xộn", () => {
    const shuffled = ["2031-03-10", "2031-01-05", "2031-03-03", "2031-02-01", "2031-01-02"].map((date) => ({ date, reason: "overlap" }));
    expect(allSkippedSummary(shuffled)).toBe("Bỏ qua tất cả 5 ngày trùng lịch: 02/01, 05/01, 01/02 (+2)");
    expect(generateSessionsSummary(0, shuffled)).toBe("Đã tạo 0 buổi học. Bỏ qua 5 ngày trùng lịch: 02/01, 05/01, 01/02 (+2)");
  });

  it("L2: không đổi thứ tự mảng đầu vào", () => {
    const input = [{ date: "2031-03-10", reason: "overlap" }, { date: "2031-01-05", reason: "overlap" }];
    generateSessionsSummary(0, input);
    expect(input.map((s) => s.date)).toEqual(["2031-03-10", "2031-01-05"]);
  });

  it("L4: lý do lạ đọc là 'Bỏ qua 1 ngày (không rõ lý do)'", () => {
    expect(generateSessionsSummary(0, [{ date: "2031-03-31", reason: "holiday" }])).toBe(
      "Đã tạo 0 buổi học. Bỏ qua 1 ngày (không rõ lý do): 31/03",
    );
    expect(allSkippedSummary([{ date: "2031-03-31", reason: "holiday" }])).toBe("Bỏ qua tất cả 1 ngày (không rõ lý do): 31/03");
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
