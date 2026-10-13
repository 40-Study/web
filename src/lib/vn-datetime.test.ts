import { describe, expect, it } from "vitest";
import { courseLevelLabel } from "./course-level";
import { formatVnDateOnly, formatVnDateTime, formatVnDateThenTime } from "./vn-datetime";

describe("courseLevelLabel", () => {
  it("dịch mã trình độ sang tiếng Việt", () => {
    expect(courseLevelLabel("beginner")).toBe("Cơ bản");
    expect(courseLevelLabel("intermediate")).toBe("Trung cấp");
    expect(courseLevelLabel("advanced")).toBe("Nâng cao");
    expect(courseLevelLabel("all_levels")).toBe("Mọi trình độ");
  });
  it("rỗng thì —, mã lạ giữ nguyên", () => {
    expect(courseLevelLabel("")).toBe("—");
    expect(courseLevelLabel(undefined)).toBe("—");
    expect(courseLevelLabel("expert")).toBe("expert");
  });
});

describe("formatVnDateOnly", () => {
  it("đổi YYYY-MM-DD sang DD/MM/YYYY không qua múi giờ", () => {
    expect(formatVnDateOnly("2026-10-03")).toBe("03/10/2026");
  });
  it("rỗng thì —", () => {
    expect(formatVnDateOnly(null)).toBe("—");
  });
});

describe("formatVnDateTime", () => {
  it("không in chuỗi ISO thô và luôn theo giờ Việt Nam", () => {
    const text = formatVnDateTime("2026-09-28T18:00:09+07:00");
    expect(text).not.toContain("T18");
    expect(text).toContain("18:00");
    expect(text).toContain("28/09/2026");
  });
  it("chuỗi hỏng thì —", () => {
    expect(formatVnDateTime("khong-phai-ngay")).toBe("—");
  });
});
describe("formatVnDateThenTime", () => {
  it("ngày trước, giờ sau (dd/MM/yyyy HH:mm) theo giờ Việt Nam", () => {
    expect(formatVnDateThenTime("2026-10-07T19:00:00+07:00")).toBe("07/10/2026 19:00");
  });
  it("đổi múi giờ sang giờ Việt Nam, kể cả khi qua nửa đêm", () => {
    expect(formatVnDateThenTime("2026-10-07T17:30:00Z")).toBe("08/10/2026 00:30");
  });
  it("rỗng/chuỗi hỏng thì — (không hiện Invalid Date)", () => {
    expect(formatVnDateThenTime(null)).toBe("—");
    expect(formatVnDateThenTime("khong-phai-ngay")).toBe("—");
  });
});
