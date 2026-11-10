/**
 * Định dạng tiền VNĐ dùng chung "438.200đ" (chấm phân cách nghìn, hậu tố "đ" dính liền) — QA-C-12.
 *
 * Trước đây khu admin vừa có "699.000 ₫" (`formatCurrency` của lib/utils, Intl style currency) vừa có "250.000đ"
 * (rút tiền, voucher). Ví giảng viên và luồng rút tiền đã chốt kiểu "đ" (withdrawal-contract.md), nên các màn
 * admin dùng chung đúng hàm đó. Không đổi `formatCurrency` vì nhiều trang ngoài admin còn phụ thuộc định dạng cũ.
 */
export { formatWithdrawalAmount as formatVnd } from "./withdrawal-format";
