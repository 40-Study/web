import { describe, expect, it } from "vitest";
import { slugifyName } from "./slug";

describe("slugifyName", () => {
  it("bỏ dấu tiếng Việt như backend GenerateSlug", () => {
    expect(slugifyName("Lập trình Web")).toBe("lap-trinh-web");
    expect(slugifyName("Đồ họa & Thiết kế")).toBe("do-hoa-thiet-ke");
  });
  it("gộp khoảng trắng, cắt dấu gạch ở hai đầu", () => {
    expect(slugifyName("  Khoa   học dữ liệu  ")).toBe("khoa-hoc-du-lieu");
  });
});