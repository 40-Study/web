/**
 * Định dạng tiền VNĐ cho khu admin: cùng `formatCurrency` (lib/utils) như toàn web, "438.200 ₫" (QA-C-12, Q6-T06).
 *
 * Trước đây admin dùng kiểu "438.200đ" riêng của luồng rút tiền trong khi giỏ hàng/voucher dùng "₫"; chủ dự án chốt
 * một định dạng duy nhất là `formatCurrency` nên cả hai nguồn giờ trỏ về nó (xem lib/withdrawal-format.ts).
 */
export { formatWithdrawalAmount as formatVnd } from "./withdrawal-format";
