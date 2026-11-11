import { ApiError, NetworkError, RateLimitError } from "@/lib/errors";
import { getErrorMessage } from "@/lib/error-messages";
import { USER_NOT_FOUND_CODE } from "@/services/organization.service";

/**
 * Câu báo lỗi khi chủ tổ chức tra người dùng theo email (GET /organizations/:id/user-lookup, QA-C-01).
 * Backend phân biệt bằng status; 403 KHÔNG có `code` nên đọc message để tách "khác tổ chức đang dùng" (người dùng
 * cần chuyển tổ chức) với "thiếu quyền" (vai hiện tại không quản lý được thành viên).
 */
export function userLookupErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) return "Không kết nối được máy chủ, thử lại sau.";
  // Backend #146: user-lookup giới hạn 30 lần/phút/người, 429 kèm retry_after (api-client đọc vào RateLimitError).
  if (error instanceof RateLimitError) {
    return error.retryAfter
      ? `Bạn tra cứu quá nhanh, thử lại sau ${error.retryAfter} giây.`
      : "Bạn tra cứu quá nhanh, vui lòng đợi một chút rồi thử lại.";
  }
  if (!(error instanceof ApiError)) return getErrorMessage(error, "Không tìm được người dùng, thử lại sau.");
  switch (error.status) {
    case 404:
      // Chỉ 404 mang code USER_NOT_FOUND mới là "không có người này". 404 khác (vd route chưa deploy) mà cũng báo
      // "không tìm thấy" thì chủ tổ chức tưởng nhập sai email (review PR #111).
      return error.code === USER_NOT_FOUND_CODE
        ? "Không tìm thấy người dùng với email này."
        : "Không tra cứu được, thử lại sau.";
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
