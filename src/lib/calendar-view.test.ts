import { describe, expect, it } from "vitest";
import { defaultCalendarView } from "./calendar-view";

describe("defaultCalendarView (P-06 / Q20)", () => {
  it.each([320, 390, 639])("%ipx -> ngày", (width) => {
    expect(defaultCalendarView(width)).toBe("timeGridDay");
  });

  it.each([640, 768, 1280])("%ipx -> tuần (desktop không đổi)", (width) => {
    expect(defaultCalendarView(width)).toBe("timeGridWeek");
  });
});
