/**
 * QA8-A03: ở 1280px cột "Chi tiết" ghim (sticky từ sm) đè 35px lên "Ngày tạo" ở Đơn hàng, và cùng mẫu ở Khoá học, Rút
 * tiền, Kiểm duyệt. Mọi cột hành động dùng chung một quy tắc ghim: có ghim ở mobile và từ 2xl, KHÔNG ghim ở sm..2xl.
 */
import { describe, expect, it } from "vitest";
import { PIN_BELOW_SM_AND_FROM_2XL, STICKY_ACTION_CELL, STICKY_ACTION_HEAD } from "./sticky-action-column";

describe("sticky-action-column", () => {
  it.each([
    ["th", STICKY_ACTION_HEAD],
    ["td", STICKY_ACTION_CELL],
  ])("cột hành động (%s) bỏ ghim từ sm tới dưới 2xl, ghim lại từ 2xl", (_name, cls) => {
    const tokens = cls.split(/\s+/);
    expect(tokens).toContain("sticky");
    expect(tokens, "hết ghim từ sm").toContain("sm:static");
    expect(tokens, "ghim lại từ 2xl").toContain("2xl:sticky");
  });

  it("dùng đúng hằng số của trang Người dùng (một nguồn sự thật)", () => {
    for (const token of PIN_BELOW_SM_AND_FROM_2XL.split(/\s+/)) {
      expect(STICKY_ACTION_HEAD.split(/\s+/)).toContain(token);
      expect(STICKY_ACTION_CELL.split(/\s+/)).toContain(token);
    }
  });
});
