import { describe, expect, it } from "vitest";
import { withClassPrefix } from "./class-label";

describe("withClassPrefix", () => {
  it("thêm chữ Lớp khi tên chưa có", () => {
    expect(withClassPrefix("Flutter Mobile K5")).toBe("Lớp Flutter Mobile K5");
  });
  it("không lặp chữ Lớp khi tên đã mở đầu bằng Lớp", () => {
    expect(withClassPrefix("Lớp Flutter Mobile K5")).toBe("Lớp Flutter Mobile K5");
    expect(withClassPrefix("lớp 10A")).toBe("lớp 10A");
  });
  it("không nhầm từ khác chỉ chung vài chữ đầu", () => {
    expect(withClassPrefix("Lớpx")).toBe("Lớp Lớpx");
  });
});