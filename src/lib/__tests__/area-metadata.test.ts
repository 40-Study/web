import { describe, expect, it } from "vitest";
import { areaMetadata } from "../area-metadata";

const MENU = [
  { href: "/x", label: "Mục X" },
  { href: "/y", label: "Tổng quan" },
];

describe("areaMetadata", () => {
  it("lấy tiêu đề từ nhãn mục menu của chính href đó", () => {
    expect(areaMetadata(MENU, "/x").title).toEqual({ default: "Mục X", template: "%s | ForteX" });
  });

  it("override thay cho nhãn quá chung", () => {
    expect(areaMetadata(MENU, "/y", "Tổng quan tổ chức").title).toMatchObject({ default: "Tổng quan tổ chức" });
  });

  it("href không có trong menu là lỗi cấu hình: ném lỗi, không lặng lẽ rơi về tiêu đề trơn", () => {
    expect(() => areaMetadata(MENU, "/z")).toThrow(/\/z/);
  });
});
