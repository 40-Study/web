import { describe, expect, it } from "vitest";
import { lastPageToClampTo } from "./clamp-page";

describe("lastPageToClampTo (QA7-A06)", () => {
  it("trang vượt trang cuối -> trang cuối", () => {
    expect(lastPageToClampTo(9999, 31)).toBe(31);
  });
  it("trang hợp lệ hoặc đúng trang cuối -> không đổi", () => {
    expect(lastPageToClampTo(31, 31)).toBeNull();
    expect(lastPageToClampTo(1, 31)).toBeNull();
  });
  it("chưa biết số trang hoặc không có kết quả (0) -> không đổi, không đẩy về trang 0", () => {
    expect(lastPageToClampTo(5, undefined)).toBeNull();
    expect(lastPageToClampTo(5, 0)).toBeNull();
    expect(lastPageToClampTo(5, Number.NaN)).toBeNull();
  });
});
