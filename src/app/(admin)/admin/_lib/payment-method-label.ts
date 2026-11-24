const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Chuyển khoản ngân hàng",
  qr_transfer: "Chuyển khoản QR",
  // QA5-A06: dữ liệu seed cũ ghi `vnpay`; trước đây hiện nguyên mã chữ thường.
  vnpay: "VNPay",
};

/** Mã lạ vẫn hiện (admin cần biết) nhưng kèm nhãn tiếng Việt thay vì in trần mã chữ thường. */
export function paymentMethodLabel(code: string | null | undefined): string {
  if (!code) return "-";
  return PAYMENT_METHOD_LABEL[code] ?? `Khác (${code})`;
}
