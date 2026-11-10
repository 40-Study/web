import { ApiError, NetworkError } from "@/lib/errors";
import { getErrorMessage } from "@/lib/error-messages";

/**
 * Câu báo lỗi khi chủ tổ chức tra người dùng theo email (GET /organizations/:id/user-lookup, QA-C-01).
 * Backend phân biệt bằng status; 403 KHÔNG có `code` nên đọc message để tách "khác tổ chức đang dùng" (người dùng
 * cần chuyển tổ chức) với "thiếu quyền" (vai hiện tại không quản lý được thành viên).
 */
export function userLookupErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) return "Không kết nối được máy chủ, thử lại sau.";
  if (!(error instanceof ApiError)) return getErrorMessage(error, "Không tìm được người dùng, thử lại sau.");
  switch (error.status) {
    case 404:
      return "Không tìm thấy người dùng với email này.";
    case 400:
      return "Email không hợp lệ. Kiểm tra lại địa chỉ email.";
    case 403:
      return /active organization does not match/i.test(error.message)
        ? "Bạn đang dùng vai của một tổ chức khác. Chuyển sang vai Chủ tổ chức của tổ chức này (menu tài khoản ở góc phải) rồi thử lại."
        : "Vai trò hiện tại của bạn không có quyền quản lý thành viên tổ chức này.";
    default:
      return getErrorMessage(error, "Không tìm được người dùng, thử lại sau.");
  }
}
