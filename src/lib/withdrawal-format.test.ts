/**
 * Q6-T06: định dạng tiền của luồng rút tiền KHÔNG có kiểu riêng: nó là `formatCurrency` ("100.000 ₫"), cùng thẻ khoá học,
 * voucher, giỏ hàng. Test so thẳng với formatCurrency để hai nguồn không thể lệch nhau lần nữa.
 */

import { describe, expect, it } from "vitest";
import { formatCurrency } from "./utils";
import { formatWithdrawalAmount } from "./withdrawal-format";
import { formatVnd } from "./vnd-format";

describe("formatWithdrawalAmount", () => {
  it("100000 -> '100.000 ₫' và đúng bằng formatCurrency", () => {
    expect(formatWithdrawalAmount(100000)).toBe("100.000\u00a0₫");
    expect(formatWithdrawalAmount(100000)).toBe(formatCurrency(100000));
    expect(formatWithdrawalAmount(599000)).toBe(formatCurrency(599000));
  });

  it("formatVnd (khu admin) là cùng một hàm, không có định dạng thứ hai", () => {
    expect(formatVnd(438200)).toBe(formatCurrency(438200));
    expect(formatVnd(438200)).not.toContain("đ");
  });

  it("-200000 -> '-200.000 ₫' (số âm giữ dấu trừ)", () => {
    expect(formatWithdrawalAmount(-200000)).toBe(formatCurrency(-200000));
    expect(formatWithdrawalAmount(-200000)).toContain("200.000");
  });

  it("chấp nhận cả chuỗi số (vd '500000')", () => {
    expect(formatWithdrawalAmount("500000")).toBe(formatCurrency(500000));
  });

  it("giá trị không hợp lệ -> '0 ₫' thay vì NaN", () => {
    expect(formatWithdrawalAmount("not-a-number")).toBe(formatCurrency(0));
  });
});
