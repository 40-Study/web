import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildTodaySchedule, TodaySchedule } from "./today-schedule";
import type { ClassSchedule } from "@/types/class-schedule";

// 2026-09-30 là Thứ Tư (day_of_week = 3)
const NOW = new Date(2026, 8, 30, 10, 0, 0);

function make(partial: Partial<ClassSchedule> & { id: string }): ClassSchedule {
  return {
    class_id: "c1",
    day_of_week: 3,
    start_time: "08:00",
    end_time: "09:00",
    created_at: "",
    updated_at: "",
    ...partial,
  };
}

describe("buildTodaySchedule", () => {
  it("chỉ giữ lịch của hôm nay và sắp theo giờ bắt đầu", () => {
    const items = buildTodaySchedule(
      [
        make({ id: "late", start_time: "14:00", end_time: "15:00" }),
        make({ id: "other-day", day_of_week: 1 }),
        make({ id: "early", start_time: "07:00", end_time: "07:45" }),
      ],
      NOW
    );
    expect(items.map((i) => i.id)).toEqual(["early", "late"]);
  });

  it("gắn trạng thái done / ongoing / upcoming theo giờ hiện tại", () => {
    const items = buildTodaySchedule(
      [
        make({ id: "a", start_time: "08:00", end_time: "09:00" }),
        make({ id: "b", start_time: "09:30", end_time: "10:30" }),
        make({ id: "c", start_time: "13:00", end_time: "14:00" }),
      ],
      NOW
    );
    expect(items.map((i) => i.status)).toEqual(["done", "ongoing", "upcoming"]);
  });

  it("dùng tên mặc định khi thiếu tiêu đề", () => {
    expect(buildTodaySchedule([make({ id: "x" })], NOW)[0].title).toBe("Buổi học");
  });
});

describe("TodaySchedule", () => {
  it("hiện trạng thái rỗng khi không có lịch", () => {
    render(<TodaySchedule items={[]} />);
    expect(screen.getByText("Hôm nay bạn không có lịch học.")).toBeTruthy();
  });

  it("luôn kèm nhãn chữ cho trạng thái, không chỉ chấm màu", () => {
    render(
      <TodaySchedule
        items={buildTodaySchedule([make({ id: "b", start_time: "09:30", end_time: "10:30" })], NOW)}
      />
    );
    expect(screen.getByText("Đang diễn ra")).toBeTruthy();
    expect(screen.getByText("09:30 – 10:30")).toBeTruthy();
  });
});
