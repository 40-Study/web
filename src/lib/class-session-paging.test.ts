import { describe, expect, it } from "vitest";
import { pageContainingToday } from "./class-session-paging";

// 12:00 giờ VN ngày 2026-06-10.
const NOW = new Date("2026-06-10T05:00:00Z");
const days = (n: number, start = "2026-05-01") =>
  Array.from({ length: n }, (_, i) => ({ date: new Date(Date.parse(`${start}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10) }));

describe("pageContainingToday (Q8-T06)", () => {
  it("104 buổi liên tiếp từ 01/03, hôm nay 10/06 là buổi thứ 102: mở trang 6 chứ không phải trang 1", () => {
    expect(pageContainingToday(days(104, "2026-03-01"), 20, NOW)).toBe(6);
  });

  it("buổi hôm nay tính là 'từ hôm nay', buổi hôm qua thì không", () => {
    const s = [{ date: "2026-06-09" }, { date: "2026-06-10" }, { date: "2026-06-11" }];
    expect(pageContainingToday(s, 1, NOW)).toBe(2);
  });

  it("toàn bộ buổi còn ở tương lai: trang 1; đã qua hết: trang cuối; rỗng: trang 1", () => {
    expect(pageContainingToday(days(45, "2026-07-01"), 20, NOW)).toBe(1);
    expect(pageContainingToday(days(45, "2026-01-01"), 20, NOW)).toBe(3);
    expect(pageContainingToday([], 20, NOW)).toBe(1);
  });

  it("date RFC3339 nửa đêm giờ VN vẫn lấy đúng ngày", () => {
    expect(pageContainingToday([{ date: "2026-06-09T00:00:00+07:00" }, { date: "2026-06-10T00:00:00+07:00" }], 1, NOW)).toBe(2);
  });
});
