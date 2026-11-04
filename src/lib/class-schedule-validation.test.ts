import { describe, expect, it } from "vitest";
import {
  toDateOnly,
  toTimeOfDay,
  validateGenerateRange,
  validateScheduleForm,
  validateSessionForm,
  weekdayLabel,
} from "./class-schedule-validation";

const valid = { dayOfWeek: "1", startTime: "18:00", endTime: "20:00", room: "", effectiveFrom: "2026-11-01", effectiveUntil: "" };

describe("validateScheduleForm", () => {
  it("hợp lệ: không có lỗi", () => {
    expect(validateScheduleForm(valid)).toEqual({});
  });

  it("giờ kết thúc bằng hoặc trước giờ bắt đầu bị chặn (backend ErrSessionTimeOrder)", () => {
    expect(validateScheduleForm({ ...valid, endTime: "18:00" }).endTime).toMatch(/sau giờ bắt đầu/);
    expect(validateScheduleForm({ ...valid, endTime: "17:30" }).endTime).toMatch(/sau giờ bắt đầu/);
  });

  it("thiếu thứ, giờ, ngày áp dụng", () => {
    const errors = validateScheduleForm({ ...valid, dayOfWeek: "", startTime: "", effectiveFrom: "" });
    expect(Object.keys(errors).sort()).toEqual(["dayOfWeek", "effectiveFrom", "startTime"]);
  });

  it("thứ 0 (Chủ nhật) là hợp lệ, không bị coi là rỗng", () => {
    expect(validateScheduleForm({ ...valid, dayOfWeek: "0" }).dayOfWeek).toBeUndefined();
  });

  it("ngày kết thúc trước ngày bắt đầu áp dụng bị chặn", () => {
    expect(validateScheduleForm({ ...valid, effectiveUntil: "2026-10-31" }).effectiveUntil).toBeTruthy();
  });
});

describe("validateSessionForm", () => {
  it("thiếu ngày và giờ kết thúc không sau giờ bắt đầu", () => {
    const errors = validateSessionForm({ date: "", startTime: "09:00", endTime: "08:00", topic: "" });
    expect(errors.date).toBeTruthy();
    expect(errors.endTime).toMatch(/sau giờ bắt đầu/);
  });
});

describe("validateGenerateRange", () => {
  it("khoảng ngày đảo ngược hoặc dài hơn 1 năm bị chặn, 366 ngày vẫn được", () => {
    expect(validateGenerateRange({ startDate: "2026-11-10", endDate: "2026-11-01" }).endDate).toBeTruthy();
    expect(validateGenerateRange({ startDate: "2026-01-01", endDate: "2027-06-01" }).endDate).toMatch(/1 năm/);
    expect(validateGenerateRange({ startDate: "2026-01-01", endDate: "2027-01-02" })).toEqual({});
    expect(validateGenerateRange({ startDate: "2026-01-01", endDate: "2027-01-03" }).endDate).toBeTruthy();
  });
});

describe("định dạng", () => {
  it("nhãn thứ theo day_of_week backend (0 = Chủ nhật), cắt ngày/giờ về dạng input", () => {
    expect(weekdayLabel(0)).toBe("Chủ nhật");
    expect(weekdayLabel(1)).toBe("Thứ hai");
    expect(toDateOnly("2026-11-04T00:00:00Z")).toBe("2026-11-04");
    expect(toTimeOfDay("18:30:00")).toBe("18:30");
    expect(toDateOnly(undefined)).toBe("");
  });
});
