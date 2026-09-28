/**
 * Chuyển lỗi API sang thông báo tiếng Việt cho người dùng (QA vòng 2: N9, P-N1, N-13).
 *
 * TẠI SAO dịch ở tầng hiển thị, không dịch ngay trong api-client: vài nơi đang nhận diện lỗi bằng
 * chính chuỗi tiếng Anh của backend (`use-wallet.ts` map theo `error.message`,
 * `translateOtpErrorMessage`, `apply-teacher-button.tsx` regex /already have/). Đổi `message` ở
 * nguồn sẽ âm thầm làm hỏng các nơi đó. Nơi nào HIỂN THỊ lỗi thì gọi `getErrorMessage(error)`.
 *
 * Thứ tự tra: `code` → chuỗi khớp chính xác → mẫu → message đã có dấu tiếng Việt → câu chung
 * theo HTTP status. Chuỗi ASCII không khớp gì bị coi là chi tiết kỹ thuật (vd. "invalid UUID
 * length: 14", lỗi GORM) và KHÔNG bao giờ được in ra.
 */

import { ApiError, NetworkError, RateLimitError } from "./errors";

export const GENERIC_ERROR_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại";
export const NETWORK_ERROR_MESSAGE = "Mất kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.";
export const SESSION_EXPIRED_MESSAGE = "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại";
const FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này";
const NOT_FOUND_MESSAGE = "Không tìm thấy dữ liệu, có thể đã bị xoá";
const INVALID_INPUT_MESSAGE = "Dữ liệu gửi lên không hợp lệ, vui lòng kiểm tra lại";

/** Heuristic dùng chung với query-state.tsx / approval-errors.ts: lỗi kỹ thuật gần như luôn ASCII. */
export const HAS_VIETNAMESE_DIACRITICS = /[à-ỹÀ-Ỹ]/;

const CODE_MESSAGES: Record<string, string> = {
  ACCOUNT_LOCKED: "Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên.",
  ERR_UNAUTHORIZED: SESSION_EXPIRED_MESSAGE,
  ERR_FORBIDDEN: FORBIDDEN_MESSAGE,
  ERR_NOT_FOUND: NOT_FOUND_MESSAGE,
  ERR_INVALID_ID: INVALID_INPUT_MESSAGE,
  ERR_INVALID_REQUEST: INVALID_INPUT_MESSAGE,
  ERR_INVALID_BODY: INVALID_INPUT_MESSAGE,
  ERR_VALIDATION: INVALID_INPUT_MESSAGE,
  HARD_DELETE_FORBIDDEN: FORBIDDEN_MESSAGE,
  INVALID_COURSE_STATUS: "Trạng thái khoá học đã thay đổi. Vui lòng tải lại trang.",
  COURSE_STATUS_CHANGE_NOT_ALLOWED: "Không thể đổi trạng thái trực tiếp, hãy dùng chức năng gửi duyệt.",
  APPLICATION_NOT_PENDING: "Hồ sơ không còn ở trạng thái chờ duyệt. Vui lòng tải lại trang.",
  APPLICATION_NOT_REJECTED: "Chỉ có thể nộp lại hồ sơ đang bị từ chối.",
  APPLICATION_UNDER_REVIEW: "Hồ sơ của bạn đang chờ duyệt.",
  RESUBMISSION_LIMIT_REACHED: "Bạn đã nộp lại quá số lần cho phép. Vui lòng liên hệ hỗ trợ.",
};

// Khoá là message backend viết thường (so khớp không phân biệt hoa thường).
const EXACT_MESSAGES: Record<string, string> = {
  "incorrect current password": "Mật khẩu hiện tại không đúng",
  "invalid email or password": "Email hoặc mật khẩu không đúng",
  "invalid password": "Mật khẩu không đúng",
  "email already registered": "Email này đã được đăng ký",
  "account is deactivated": "Tài khoản đã bị vô hiệu hoá",
  "user account is inactive": "Tài khoản chưa được kích hoạt hoặc đã bị vô hiệu hoá",
  "cannot lock your own account": "Bạn không thể tự khoá tài khoản của mình",
  "cannot lock/revoke the last active system admin":
    "Không thể khoá hoặc thu hồi quản trị viên cuối cùng của hệ thống",
  "reason is required when locking an account": "Vui lòng nhập lý do khoá tài khoản",
  "reason is required": "Vui lòng nhập lý do",
  "reason must be at most 1000 characters": "Lý do tối đa 1000 ký tự",
  "cannot disconnect last authentication method":
    "Không thể ngắt phương thức đăng nhập cuối cùng của tài khoản",
  "otp has expired": "Mã OTP đã hết hạn, vui lòng bấm \"Gửi lại mã\"",
  "otp not found or expired": "Mã OTP đã hết hạn, vui lòng bấm \"Gửi lại mã\"",
  "invalid otp data": "Mã OTP không hợp lệ, vui lòng thử lại",
  "too many failed attempts, please request a new otp": "Bạn nhập sai quá nhiều lần, vui lòng yêu cầu mã OTP mới",
  "registration request not found or expired, please request again":
    "Yêu cầu đăng ký đã hết hạn, vui lòng đăng ký lại",
  "already enrolled in course": "Bạn đã đăng ký khoá học này",
  "already enrolled in this course": "Bạn đã đăng ký khoá học này",
  "not enrolled in this course": "Bạn chưa đăng ký khoá học này",
  "not enrolled in the course containing this lesson": "Bạn chưa đăng ký khoá học chứa bài học này",
  "payment required for this course": "Khoá học này cần thanh toán trước khi học",
  "lesson locked": "Bài học đang bị khoá",
  "course must be completed before issuing a certificate": "Cần hoàn thành khoá học trước khi nhận chứng chỉ",
  "certificate already issued for this course": "Chứng chỉ của khoá học này đã được cấp",
  "coupon expired": "Mã giảm giá đã hết hạn",
  "coupon invalid": "Mã giảm giá không hợp lệ",
  "invalid coupon": "Mã giảm giá không hợp lệ",
  "coupon not found": "Không tìm thấy mã giảm giá",
  "coupon not applicable to selected courses": "Mã giảm giá không áp dụng cho khoá học đã chọn",
  "coupon per-user limit exceeded": "Bạn đã dùng hết lượt của mã giảm giá này",
  "coupon usage limit exceeded": "Mã giảm giá đã hết lượt sử dụng",
  "voucher is expired": "Voucher đã hết hạn",
  "voucher is inactive": "Voucher đang tạm ngưng",
  "voucher is not started yet": "Voucher chưa đến thời gian áp dụng",
  "voucher usage limit exceeded": "Voucher đã hết lượt sử dụng",
  "voucher usage limit per user exceeded": "Bạn đã dùng hết lượt của voucher này",
  "order does not meet minimum purchase requirement": "Đơn hàng chưa đạt giá trị tối thiểu để dùng mã",
  "order already cancelled": "Đơn hàng đã bị huỷ",
  "order already completed": "Đơn hàng đã hoàn tất",
  "order already refunded": "Đơn hàng đã được hoàn tiền",
  "only completed orders can be refunded": "Chỉ hoàn tiền được cho đơn đã hoàn tất",
  "no courses selected": "Bạn chưa chọn khoá học nào",
  "insufficient balance": "Số dư không đủ",
  "amount exceeds available balance": "Số tiền vượt quá số dư khả dụng",
  "amount is below the minimum withdrawal": "Số tiền thấp hơn mức rút tối thiểu",
  "amount must be greater than 0": "Số tiền phải lớn hơn 0",
  "bank info required before withdrawal": "Vui lòng cập nhật thông tin ngân hàng trước khi rút tiền",
  "you already have a withdrawal request in progress": "Bạn đang có một yêu cầu rút tiền chờ xử lý",
  "payment expired": "Phiên thanh toán đã hết hạn",
  "payment already processed": "Giao dịch đã được xử lý",
  "you have already reported this content": "Bạn đã báo cáo nội dung này rồi",
  "category with this name already exists": "Tên danh mục đã tồn tại",
  "cannot delete category with children": "Không thể xoá danh mục đang có danh mục con",
  "organization with this name already exists": "Tên tổ chức đã tồn tại",
  "tag with this name already exists": "Tên thẻ đã tồn tại",
  "voucher code already exists": "Mã voucher đã tồn tại",
  "voucher name already exists": "Tên voucher đã tồn tại",
  "file type not allowed": "Định dạng tệp không được hỗ trợ",
  "file is required": "Vui lòng chọn tệp",
  "upload failed": "Tải tệp lên thất bại",
  "no fields to update": "Không có thông tin nào thay đổi",
  "class is full": "Lớp học đã đủ chỗ",
  "group is full": "Nhóm đã đủ thành viên",
  "session is full": "Buổi học đã đủ chỗ",
  "cannot create conversation with yourself": "Không thể tự nhắn tin cho chính mình",
  "max attempts reached": "Bạn đã dùng hết số lần làm bài",
  "quiz attempt already submitted": "Bài làm đã được nộp",
  "teacher profile already exists for this user": "Bạn đã có hồ sơ giảng viên",
  "teacher application resubmission limit reached": "Bạn đã nộp lại hồ sơ quá số lần cho phép",
  "this role cannot be self-assigned": "Vai trò này không thể tự đăng ký",
  "idempotency key already claimed by a concurrent request": "Yêu cầu đang được xử lý, vui lòng đợi",
  "rate limiting service unavailable": "Hệ thống đang bận, vui lòng thử lại sau ít phút",
};

// Mẫu tổng quát cho nhóm lỗi lặp lại hàng trăm biến thể ("x not found", "invalid x_id"...).
const PATTERN_MESSAGES: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/invalid OTP,\s*(\d+)\s*attempts?\s*remaining/i, (m) => `Mã OTP không đúng, còn ${m[1]} lần thử`],
  [/please login again|session expired|invalid or expired refresh token/i, () => SESSION_EXPIRED_MESSAGE],
  [/^forbidden|not the (owner|teacher)|insufficient permissions|does not belong to you/i, () => FORBIDDEN_MESSAGE],
  [/not found/i, () => NOT_FOUND_MESSAGE],
  [/^invalid |uuid|format|expected rfc3339|expected yyyy/i, () => INVALID_INPUT_MESSAGE],
];

const STATUS_MESSAGES: Record<number, string> = {
  400: INVALID_INPUT_MESSAGE,
  401: SESSION_EXPIRED_MESSAGE,
  403: FORBIDDEN_MESSAGE,
  404: NOT_FOUND_MESSAGE,
  409: "Dữ liệu vừa thay đổi, vui lòng tải lại trang rồi thử lại",
  413: "Tệp quá lớn",
  422: INVALID_INPUT_MESSAGE,
};

/**
 * Dịch thông tin lỗi thô (status/code/message backend) sang câu tiếng Việt.
 * `fallback` (nếu có) thay cho câu chung theo status: nơi gọi thường biết ngữ cảnh cụ thể hơn
 * ("Không thể tạo đơn hàng") so với "Dữ liệu gửi lên không hợp lệ".
 */
export function translateApiErrorMessage(
  status: number,
  code: string | undefined,
  message: string | undefined,
  fallback?: string
): string {
  const byCode = code ? CODE_MESSAGES[code] : undefined;
  if (byCode) return byCode;

  const raw = (message ?? "").trim();
  if (raw) {
    const exact = EXACT_MESSAGES[raw.toLowerCase()];
    if (exact) return exact;
    // Backend đã trả tiếng Việt (vd. "coupon_code đã hết hạn") → giữ nguyên, đó là lý do thật.
    // Kiểm TRƯỚC mẫu: câu tiếng Việt chứa "not found"/"invalid" ở tên field không được bị đè.
    if (HAS_VIETNAMESE_DIACRITICS.test(raw)) return raw;
    for (const [pattern, toMessage] of PATTERN_MESSAGES) {
      const match = raw.match(pattern);
      if (match) return toMessage(match);
    }
  }

  return fallback ?? STATUS_MESSAGES[status] ?? GENERIC_ERROR_MESSAGE;
}

/** Câu tiếng Việt để hiển thị cho MỌI loại lỗi (toast, dòng lỗi dưới form, trang lỗi). */
export function getErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof NetworkError) return NETWORK_ERROR_MESSAGE;
  // RateLimitError tự dựng câu tiếng Việt kèm số giây (lib/errors.ts).
  if (error instanceof RateLimitError) return error.message;
  if (error instanceof ApiError) {
    // 5xx: api-client đã thay message bằng câu chung; không đọc thêm gì từ backend.
    if (error.status >= 500) return fallback ?? GENERIC_ERROR_MESSAGE;
    return translateApiErrorMessage(error.status, error.code, error.message, fallback);
  }
  if (error instanceof Error && HAS_VIETNAMESE_DIACRITICS.test(error.message)) return error.message;
  return fallback ?? GENERIC_ERROR_MESSAGE;
}
