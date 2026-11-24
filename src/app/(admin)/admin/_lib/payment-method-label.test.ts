import { describe, expect, it } from "vitest";
import { paymentMethodLabel } from "./payment-method-label";

describe("paymentMethodLabel (QA5-A06)", () => {
  it("nhãn tiếng Việt cho mã đã biết, gồm vnpay của dữ liệu seed cũ", () => {
    expect(paymentMethodLabel("bank_transfer")).toBe("Chuyển khoản ngân hàng");
    expect(paymentMethodLabel("qr_transfer")).toBe("Chuyển khoản QR");
    expect(paymentMethodLabel("vnpay")).toBe("VNPay");
  });

  it("mã lạ không bị in trần; thiếu mã thì '-'", () => {
    expect(paymentMethodLabel("crypto")).toBe("Khác (crypto)");
    expect(paymentMethodLabel(null)).toBe("-");
    expect(paymentMethodLabel(undefined)).toBe("-");
  });
});
