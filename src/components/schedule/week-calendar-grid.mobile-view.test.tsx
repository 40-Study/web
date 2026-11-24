/**
 * P-06 / Q20 (QA3 261104): ở 390px lưới tuần 7 cột bị cắt chữ. Màn hình hẹp mở ở chế độ Ngày (vẫn đổi được),
 * desktop giữ nguyên chế độ Tuần.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import WeekCalendarGrid from "./week-calendar-grid";

const originalWidth = window.innerWidth;
afterEach(() => {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
});

function renderAtWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  render(<WeekCalendarGrid events={[]} />);
  return screen.getByLabelText("Chế độ xem lịch") as HTMLSelectElement;
}

describe("WeekCalendarGrid — chế độ xem mặc định theo bề rộng", () => {
  it("390px: mở ở chế độ Ngày, và vẫn đổi sang Tuần được", () => {
    const select = renderAtWidth(390);
    expect(select.value).toBe("timeGridDay");
    expect(document.querySelector(".fc-timeGridDay-view")).not.toBeNull();

    fireEvent.change(select, { target: { value: "timeGridWeek" } });
    expect(document.querySelector(".fc-timeGridWeek-view")).not.toBeNull();
  });

  it("1280px: giữ chế độ Tuần như cũ", () => {
    const select = renderAtWidth(1280);
    expect(select.value).toBe("timeGridWeek");
    expect(document.querySelector(".fc-timeGridWeek-view")).not.toBeNull();
  });
});

// N-09 (QA4 261123): lịch của con (phụ huynh xem) từng ghi "Lịch của tôi" ở cột trái.
describe("WeekCalendarGrid — tiêu đề cột trái", () => {
  it("mặc định 'Lịch của tôi'; trang gọi đổi được", () => {
    const { unmount } = render(<WeekCalendarGrid events={[]} />);
    expect(screen.getByText("Lịch của tôi")).toBeTruthy();
    unmount();
    render(<WeekCalendarGrid events={[]} railLabel="Lịch học của con" />);
    expect(screen.getByText("Lịch học của con")).toBeTruthy();
    expect(screen.queryByText("Lịch của tôi")).toBeNull();
  });
});
