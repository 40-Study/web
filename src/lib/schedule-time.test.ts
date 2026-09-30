import { describe, expect, it } from "vitest";
import { clockTimeToMinutes, formatClockTime, parseClockTime } from "@/lib/schedule-time";

// Giá trị thật từ GET /me/timetable (seed demo, 2026-10-01).
const ISO_START = "2026-09-02T19:00:00+07:00";
const ISO_END = "2026-09-09T21:30:00+07:00";

// Kỳ vọng tính theo múi giờ của máy chạy test, vì helper trả giờ ĐỊA PHƯƠNG.
function localOf(iso: string) {
  const d = new Date(iso);
  return { hours: d.getHours(), minutes: d.getMinutes() };
}

describe("parseClockTime", () => {
  it("đọc HH:MM và HH:MM:SS", () => {
    expect(parseClockTime("19:00")).toEqual({ hours: 19, minutes: 0 });
    expect(parseClockTime("7:05")).toEqual({ hours: 7, minutes: 5 });
    expect(parseClockTime("21:30:00")).toEqual({ hours: 21, minutes: 30 });
    expect(parseClockTime("08:15:00.000000")).toEqual({ hours: 8, minutes: 15 });
  });

  it("đọc timestamp ISO đầy đủ theo giờ địa phương", () => {
    expect(parseClockTime(ISO_START)).toEqual(localOf(ISO_START));
    expect(parseClockTime(ISO_END)).toEqual(localOf(ISO_END));
    expect(parseClockTime("2026-09-02T12:00:00Z")).toEqual(localOf("2026-09-02T12:00:00Z"));
  });

  it("trả null thay vì NaN với chuỗi hỏng", () => {
    for (const bad of ["", "  ", "abc", "25:00", "10:75", "2026-13-45T99:00:00", null, undefined]) {
      expect(parseClockTime(bad)).toBeNull();
    }
  });
});

describe("clockTimeToMinutes", () => {
  it("không bao giờ ra NaN với timestamp — lỗi gốc của trang lịch", () => {
    const mins = clockTimeToMinutes(ISO_START);
    expect(mins).not.toBeNull();
    expect(Number.isNaN(mins)).toBe(false);
    const { hours, minutes } = localOf(ISO_START);
    expect(mins).toBe(hours * 60 + minutes);
  });

  it("tính đúng cho HH:MM", () => {
    expect(clockTimeToMinutes("19:30")).toBe(19 * 60 + 30);
    expect(clockTimeToMinutes("xx")).toBeNull();
  });
});

describe("formatClockTime", () => {
  it("định dạng HH:MM cho cả hai dạng input", () => {
    expect(formatClockTime("7:05:00")).toBe("07:05");
    const { hours, minutes } = localOf(ISO_END);
    expect(formatClockTime(ISO_END)).toBe(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    );
    expect(formatClockTime("rác")).toBe("");
  });
});
