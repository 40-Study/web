import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errors";
import { describeScheduleError } from "./class-schedule-errors";

describe("describeScheduleError", () => {
  it("409 trùng giờ: câu tiếng Việt kèm chi tiết backend", () => {
    const err = new ApiError(409, "UNKNOWN", "buổi học trùng giờ với một buổi khác của lớp này hoặc của giảng viên lớp");
    const text = describeScheduleError(err, "session");
    expect(text).toMatch(/^Trùng lịch:/);
    expect(text).toContain("trùng giờ với một buổi khác");
  });

  it("409 với message tiếng Anh: câu trùng lịch tiếng Việt, không lộ tiếng Anh", () => {
    const text = describeScheduleError(new ApiError(409, "UNKNOWN", "conflict"), "schedule");
    expect(text).toMatch(/trùng/);
    expect(text).not.toContain("conflict");
  });

  it("409 khi sinh buổi: nói rõ không có buổi mới", () => {
    expect(describeScheduleError(new ApiError(409, "UNKNOWN", "buổi học trùng giờ"), "generate")).toMatch(/Không có buổi mới/);
  });

  it("409 CLASS_ARCHIVED không bị nhầm thành trùng lịch", () => {
    const err = new ApiError(409, "CLASS_ARCHIVED", "Lớp đã lưu trữ nên không thể chỉnh sửa");
    expect(describeScheduleError(err, "session")).toBe("Lớp đã lưu trữ nên không thể chỉnh sửa");
  });

  it("400 tiếng Anh của backend được dịch thành hướng dẫn", () => {
    expect(describeScheduleError(new ApiError(400, "UNKNOWN", "no recurring schedules found for this class"), "generate")).toMatch(/thêm lịch học/);
    expect(describeScheduleError(new ApiError(400, "UNKNOWN", "date range for generating sessions is too long"), "generate")).toMatch(/1 năm/);
  });

  it("lỗi khác đi qua bảng chung, không in tiếng Anh", () => {
    expect(describeScheduleError(new ApiError(403, "ERR_FORBIDDEN", "forbidden"))).toBe("Bạn không có quyền thực hiện thao tác này");
  });
});
