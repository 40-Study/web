import { describe, expect, it } from "vitest";
import { buildTodaySchedule } from "@/components/dashboard/today-schedule";
import type { ClassSchedule } from "@/types/class-schedule";

// Dựng timestamp ISO từ giờ ĐỊA PHƯƠNG để kỳ vọng không phụ thuộc múi giờ máy chạy test.
// Ngày trong timestamp là ngày gốc của lịch lặp (giống API thật), không phải hôm nay.
const iso = (h: number, m: number) => new Date(2026, 8, 2, h, m).toISOString();

// 01/10/2026 20:00 giờ địa phương; lịch "hôm nay" lấy đúng thứ của mốc này.
const NOW = new Date(2026, 9, 1, 20, 0);

function schedule(id: string, start: string, end: string, dow = NOW.getDay()): ClassSchedule {
  return {
    id, class_id: "c1", title: `Lớp ${id}`, day_of_week: dow,
    start_time: start, end_time: end, created_at: "", updated_at: "",
  };
}

describe("buildTodaySchedule", () => {
  const now = NOW;

  it("đọc được timestamp ISO của /me/timetable (không ra '2026-' hay NaN)", () => {
    const items = buildTodaySchedule(
      [schedule("b", iso(19, 30), iso(21, 30)), schedule("a", iso(7, 0), iso(9, 0))],
      now
    );
    expect(items.map((i) => [i.id, i.start, i.end, i.status])).toEqual([
      ["a", "07:00", "09:00", "done"],
      ["b", "19:30", "21:30", "ongoing"],
    ]);
  });

  it("vẫn nhận dạng HH:MM:SS", () => {
    const [item] = buildTodaySchedule([schedule("x", "21:00:00", "22:00:00")], now);
    expect(item).toMatchObject({ start: "21:00", end: "22:00", status: "upcoming" });
  });

  it("bỏ mục khác thứ hoặc giờ hỏng", () => {
    const items = buildTodaySchedule(
      [schedule("khac-thu", "08:00", "09:00", (NOW.getDay() + 1) % 7), schedule("hong", "abc", "09:00")],
      now
    );
    expect(items).toEqual([]);
  });
});
