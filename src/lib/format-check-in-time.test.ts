/** Review L6 (QA5-PG-03): nhánh ISO và giá trị rác của formatCheckInTime. */
import { describe, expect, it } from "vitest";
import { formatCheckInTime } from "./format-check-in-time";

describe("formatCheckInTime", () => {
  it("giờ Việt Nam dạng HH:mm (đường chính của backend) giữ nguyên, bù số 0", () => {
    expect(formatCheckInTime("19:05")).toBe("19:05");
    expect(formatCheckInTime("9:05:30")).toBe("09:05");
  });

  it("ISO UTC được đổi sang giờ Việt Nam (UTC+7), không theo múi giờ máy", () => {
    expect(formatCheckInTime("2026-11-10T12:05:00Z")).toBe("19:05");
    // 18:30 UTC là 01:30 sáng hôm sau ở Việt Nam: chứng tỏ múi giờ được áp dụng.
    expect(formatCheckInTime("2026-11-10T18:30:00Z")).toBe("01:30");
  });

  it("rỗng hoặc không đọc được thì null, không in chuỗi rác", () => {
    expect(formatCheckInTime(undefined)).toBeNull();
    expect(formatCheckInTime(null)).toBeNull();
    expect(formatCheckInTime("")).toBeNull();
    expect(formatCheckInTime("không phải giờ")).toBeNull();
  });
});
