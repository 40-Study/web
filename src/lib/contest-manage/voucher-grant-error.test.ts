/** Đọc lỗi chốt vì voucher không phát được (409 CONTEST_VOUCHER_UNAVAILABLE + details, ĐÍNH CHÍNH 3). */

import { describe, expect, it } from "vitest";

import { ContestApiError } from "@/services/contest.service";

import { parseVoucherGrantError, voucherGrantLabel } from "./voucher-grant-error";

const DETAILS = {
  user_id: "u-1",
  user_name: "Nguyễn An",
  rank: 2,
  voucher_id: "v-1",
  voucher_code: "GIAI1",
  reason: "đã hết tổng lượt dùng",
};

describe("parseVoucherGrantError", () => {
  it("409 CONTEST_VOUCHER_UNAVAILABLE có details → trả message + details", () => {
    const err = new ContestApiError(409, "CONTEST_VOUCHER_UNAVAILABLE", "Không phát được voucher GIAI1…", DETAILS);
    expect(parseVoucherGrantError(err)).toEqual({ message: "Không phát được voucher GIAI1…", details: DETAILS });
  });

  it("thiếu details (lúc duyệt/sửa giải) hoặc mã khác → null", () => {
    expect(parseVoucherGrantError(new ContestApiError(409, "CONTEST_VOUCHER_UNAVAILABLE", "x"))).toBeNull();
    expect(parseVoucherGrantError(new ContestApiError(409, "CONTEST_NOT_ENDED", "x", DETAILS))).toBeNull();
    expect(parseVoucherGrantError(new ContestApiError(409, "CONTEST_VOUCHER_UNAVAILABLE", "x", { rank: "2" }))).toBeNull();
  });

  it("voucher_code rỗng (voucher đã bị xoá) → nhãn nói rõ", () => {
    expect(voucherGrantLabel({ ...DETAILS, voucher_code: "" })).toBe("voucher đã bị xoá");
    expect(voucherGrantLabel(DETAILS)).toBe("GIAI1");
  });
});
