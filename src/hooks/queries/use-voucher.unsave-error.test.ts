import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errors";
import { unsaveVoucherErrorMessage, VOUCHER_HOLDERS_ONLY_NOT_REMOVABLE } from "./use-voucher";

// L6 mục 6: người giữ voucher dành riêng không tự bỏ lưu được; backend trả 403 kèm mã rõ ràng và web
// hiện câu giải thích thay vì lỗi chung.
describe("unsaveVoucherErrorMessage", () => {
  it("mã VOUCHER_HOLDERS_ONLY_NOT_REMOVABLE có câu riêng", () => {
    const msg = unsaveVoucherErrorMessage(new ApiError(403, VOUCHER_HOLDERS_ONLY_NOT_REMOVABLE, "forbidden"));
    expect(msg).toContain("cấp riêng cho bạn");
  });

  it("lỗi khác (mã khác hoặc không phải ApiError) dùng câu chung", () => {
    expect(unsaveVoucherErrorMessage(new ApiError(400, "ERR_UNSAVE_VOUCHER", "x"))).toBe("Không thể bỏ lưu voucher, thử lại sau.");
    expect(unsaveVoucherErrorMessage(new Error("boom"))).toBe("Không thể bỏ lưu voucher, thử lại sau.");
  });
});