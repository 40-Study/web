/**
 * Giữ mã voucher đã áp ở giỏ hàng qua lần tải lại trang (QA-A-10, 10/11/2026).
 *
 * Trước đây voucher chỉ nằm trong state của trang: tải lại là ô mã trống, tổng về giá gốc và link "Thanh toán"
 * mất `voucher=`. Chỉ lưu MÃ (không lưu số tiền giảm): khi khôi phục, VoucherInput tra lại mã với backend và
 * tính lại theo giỏ hiện tại, nên mã hết hạn/hết lượt sẽ bị gỡ kèm lý do chứ không giảm sai.
 *
 * sessionStorage (hết khi đóng tab) và khoá theo user id: máy dùng chung không lộ mã của người trước.
 * Trình duyệt chặn storage (chế độ riêng tư, iframe) thì bỏ qua im lặng: mất tiện ích, không vỡ giỏ hàng.
 */

const KEY_PREFIX = "fortex:cart-voucher:";

function storageKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export function readCartVoucher(userId: string | null | undefined): string | null {
  if (!userId || typeof window === "undefined") return null;
  try {
    const code = window.sessionStorage.getItem(storageKey(userId));
    return code && code.trim() ? code : null;
  } catch {
    return null;
  }
}

export function saveCartVoucher(userId: string | null | undefined, code: string | null): void {
  if (!userId || typeof window === "undefined") return;
  try {
    if (code) window.sessionStorage.setItem(storageKey(userId), code);
    else window.sessionStorage.removeItem(storageKey(userId));
  } catch {
    // Storage bị chặn: không lưu được thì thôi (xem chú thích đầu file).
  }
}
