import { describe, expect, it } from "vitest";
import { isClassArchived, selectableClasses } from "./class-status";

describe("lớp đã lưu trữ (chỉ đọc)", () => {
  it("isClassArchived chỉ đúng với status 'archived' của backend", () => {
    expect(isClassArchived("archived")).toBe(true);
    expect(isClassArchived("active")).toBe(false);
    expect(isClassArchived("draft")).toBe(false);
    expect(isClassArchived(undefined)).toBe(false);
    expect(isClassArchived(null)).toBe(false);
  });

  it("selectableClasses bỏ lớp lưu trữ khỏi ô chọn lớp để tạo buổi, giữ thứ tự và lớp không có status", () => {
    const list = [{ id: "a", status: "active" }, { id: "b", status: "archived" }, { id: "c" }, { id: "d", status: "draft" }];
    expect(selectableClasses(list).map((c) => c.id)).toEqual(["a", "c", "d"]);
  });
});
