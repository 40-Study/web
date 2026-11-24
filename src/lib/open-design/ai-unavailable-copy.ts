/**
 * Q6-T09: khi AI chưa cấu hình, giảng viên từng đọc chỉ dẫn vận hành ("Cấu hình API key, base URL và model Viettel AI
 * trong env backend") mà họ không làm được. Giảng viên chỉ cần biết tính năng chưa bật và phải liên hệ ai; chỉ dẫn env
 * dành cho quản trị hệ thống. Mặc định `isAdmin = false` để một lời gọi quên truyền cờ không làm lộ chỉ dẫn env.
 */

export const AI_UNAVAILABLE_FOR_TEACHER = "Tính năng AI chưa được bật, vui lòng liên hệ quản trị viên.";

/** Dòng báo dưới ô soạn tin khi AI chưa cấu hình. */
export function aiNotConfiguredNotice(isAdmin = false): string {
  return isAdmin ? "Chưa kết nối Viettel AI. Cần hoàn tất cấu hình để tạo nội dung." : AI_UNAVAILABLE_FOR_TEACHER;
}

/** Gợi ý ở màn chào khi AI chưa cấu hình (kèm nút "Kiểm tra lại"). */
export function aiNotConfiguredHint(isAdmin = false): string {
  return isAdmin
    ? "Cấu hình API key, base URL và model Viettel AI trong env backend để bắt đầu."
    : "Sau khi quản trị viên bật AI, bấm Kiểm tra lại để bắt đầu.";
}
