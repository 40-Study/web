/**
 * Nhãn trạng thái tài khoản cho trang admin users (QA vòng 2, G6 — N-04): trước đây badge hiện
 * "Active"/"Locked" tiếng Anh trong khi bộ lọc cùng trang ghi "Đang hoạt động"/"Đã khoá".
 * Dùng chung cho danh sách và trang chi tiết để hai nơi không lệch chữ.
 */
export function getUserActiveLabel(isActive: boolean): string {
  return isActive ? "Đang hoạt động" : "Đã khoá";
}
