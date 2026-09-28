/**
 * Định dạng tiền của luồng rút tiền: "100.000đ" (chấm phân tách nghìn, hậu tố đ liền), khác
 * formatCurrency cũ ("100.000 ₫").
 */

import { describe, expect, it } from "vitest";
import { formatWithdrawalAmount } from "./withdrawal-format";

describe("formatWithdrawalAmount", () => {
  it("100000 -> '100.000đ'", () => {
    expect(formatWithdrawalAmount(100000)).toBe("100.000đ");
  });

  it("-200000 -> '-200.000đ' (số âm giữ dấu trừ)", () => {
    expect(formatWithdrawalAmount(-200000)).toBe("-200.000đ");
  });

  it("chấp nhận cả chuỗi số (vd '500000')", () => {
    expect(formatWithdrawalAmount("500000")).toBe("500.000đ");
  });

  it("giá trị không hợp lệ -> '0đ' thay vì NaNđ", () => {
    expect(formatWithdrawalAmount("not-a-number")).toBe("0đ");
  });
});
