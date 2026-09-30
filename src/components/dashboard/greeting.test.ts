import { describe, expect, it } from "vitest";
import { formatToday, getGreeting } from "./greeting";

const at = (hour: number) => new Date(2026, 8, 30, hour, 0, 0);

describe("getGreeting", () => {
  it("chào buổi sáng trước 12h", () => {
    expect(getGreeting(at(0))).toBe("Chào buổi sáng");
    expect(getGreeting(at(11))).toBe("Chào buổi sáng");
  });

  it("chào buổi chiều từ 12h đến trước 18h", () => {
    expect(getGreeting(at(12))).toBe("Chào buổi chiều");
    expect(getGreeting(at(17))).toBe("Chào buổi chiều");
  });

  it("chào buổi tối từ 18h", () => {
    expect(getGreeting(at(18))).toBe("Chào buổi tối");
    expect(getGreeting(at(23))).toBe("Chào buổi tối");
  });
});

describe("formatToday", () => {
  it("viết hoa chữ đầu và có năm", () => {
    const text = formatToday(at(9));
    expect(text.charAt(0)).toBe(text.charAt(0).toUpperCase());
    expect(text).toContain("2026");
  });
});
