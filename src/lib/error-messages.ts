/**
 * Chuyển lỗi API sang thông báo tiếng Việt cho người dùng (QA vòng 2: N9, P-N1, N-13).
 *
 * TẠI SAO dịch ở tầng hiển thị, không dịch ngay trong api-client: vài nơi đang nhận diện lỗi bằng
 * chính chuỗi tiếng Anh của backend (`use-wallet.ts` map theo `error.message`,
 * `translateOtpErrorMessage`, `apply-teacher-button.tsx` regex /already have/). Đổi `message` ở
 * nguồn sẽ âm thầm làm hỏng các nơi đó. Nơi nào HIỂN THỊ lỗi thì gọi `getErrorMessage(error)`.
 *
 * Thứ tự tra: `code` riêng → chuỗi khớp chính xác → message đã có dấu tiếng Việt → mẫu → `code`
 * chung (ERR_VALIDATION, ERR_NOT_FOUND...) → `fallback` của nơi gọi → câu Việt chung theo HTTP
 * status. Chuỗi tiếng Anh không có trong bảng (lý do nghiệp vụ hay chi tiết kỹ thuật như "invalid
 * UUID length: 14") KHÔNG bao giờ được in ra.
 *
 * Khoá của bảng phải là CHUỖI backend thật sự gửi tới client qua `data.error || data.message`.
 * Vài handler đặt mã máy vào `error` (withdrawal_handler.go, admin_order_handler.go) hoặc
 * `message` ("LESSON_LOCKED"), nên khoá là mã máy chứ không phải câu tiếng Anh của service.
 */

import { ApiError, NetworkError, RateLimitError } from "./errors";

export const GENERIC_ERROR_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại";
export const NETWORK_ERROR_MESSAGE = "Mất kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.";
export const SESSION_EXPIRED_MESSAGE = "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại";
const FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này";
const NOT_FOUND_MESSAGE = "Không tìm thấy dữ liệu, có thể đã bị xoá";
const INVALID_INPUT_MESSAGE = "Dữ liệu gửi lên không hợp lệ, vui lòng kiểm tra lại";
// 409 = xung đột với trạng thái hiện có (đã có trong giỏ, đã đánh giá...). KHÔNG nói "dữ liệu vừa
// thay đổi, tải lại trang": câu đó sai sự thật với phần lớn lỗi 409 của backend (review PR #33).
const CONFLICT_MESSAGE = "Thao tác xung đột với dữ liệu hiện có";

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
  // ── Nhóm (plans/260930-groups-friends/contract-api.md §2) ──
  GROUP_ALREADY_MEMBER: "Bạn đã là thành viên của nhóm này",
  GROUP_BANNED: "Bạn đã bị cấm khỏi nhóm này",
  GROUP_FULL: "Nhóm đã đủ thành viên",
  GROUP_JOIN_REQUEST_EXISTS: "Bạn đã gửi yêu cầu tham gia nhóm này, đang chờ duyệt",
  GROUP_MEMBER_BANNED: "Người này đang bị cấm khỏi nhóm",
  GROUP_INVITE_NOT_ALLOWED: "Bạn chưa có quan hệ hợp lệ để mời người này vào nhóm",
  // ── Bạn bè (contract §1) ──
  // FRIEND_REQUEST_NOT_ALLOWED / FRIEND_REQUEST_COOLDOWN cố ý mơ hồ: không được lộ "bị chặn" hay "bị từ chối".
  FRIEND_SELF_REQUEST: "Bạn không thể kết bạn với chính mình",
  FRIEND_ROLE_NOT_ALLOWED: "Tính năng bạn bè chỉ dành cho học viên",
  FRIEND_REQUEST_NOT_ALLOWED: "Không thể gửi lời mời cho người này.",
  FRIEND_USER_NOT_FOUND: "Không tìm thấy người dùng này",
  FRIEND_REQUEST_NOT_FOUND: "Lời mời không còn tồn tại",
  FRIEND_NOT_FOUND: "Hai bạn chưa là bạn bè",
  FRIEND_ALREADY_FRIENDS: "Hai bạn đã là bạn bè",
  FRIEND_REQUEST_EXISTS: "Bạn đã gửi lời mời cho người này, đang chờ phản hồi",
  FRIEND_REQUEST_NOT_PENDING: "Lời mời này đã được xử lý, vui lòng tải lại trang",
  FRIEND_REQUEST_COOLDOWN: "Bạn chưa thể gửi lời mời cho người này lúc này.",
  // DM bị chặn (contract §4): câu cố định, không suy ra ai chặn ai.
  ERR_CONVERSATION_BLOCKED: "Không thể gửi tin nhắn trong cuộc trò chuyện này",
  FRIEND_LIMIT_REACHED: "Một trong hai bạn đã đạt số lượng bạn bè tối đa",
  FRIEND_DAILY_LIMIT_REACHED: "Hôm nay bạn đã gửi đủ lời mời, hãy thử lại vào ngày mai.",
  FRIEND_PENDING_LIMIT_REACHED: "Bạn đang có quá nhiều lời mời chờ phản hồi. Hãy đợi hoặc huỷ bớt lời mời cũ.",
};

// Code chỉ nói LOẠI lỗi, message mới nói lý do (vd. ERR_NOT_FOUND + "Voucher not found",
// ERR_VALIDATION + "bank_name, ... are required"). Với các code này xét message trước.
const GENERIC_CODES = new Set([
  "ERR_UNAUTHORIZED",
  "ERR_FORBIDDEN",
  "ERR_NOT_FOUND",
  "ERR_INVALID_ID",
  "ERR_INVALID_REQUEST",
  "ERR_INVALID_BODY",
  "ERR_VALIDATION",
]);

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
  "you are already enrolled in this course": "Bạn đã đăng ký khoá học này",
  "course already in cart": "Khoá học đã có trong giỏ hàng",
  "you have already reviewed this course": "Bạn đã đánh giá khoá học này rồi",
  "student is already enrolled in this class": "Học viên này đã có trong lớp",
  "already a member of this group": "Bạn đã là thành viên của nhóm này",
  "you are banned from this group": "Bạn đã bị chặn khỏi nhóm này",
  // Backend chưa gắn `code` GROUP_JOIN_REQUEST_EXISTS (phase 02): tới lúc đó khớp theo câu.
  "you already have a pending join request": "Bạn đã gửi yêu cầu tham gia nhóm này, đang chờ duyệt",
  "contest is full": "Cuộc thi đã đủ người tham gia",
  "contest is not accepting participants": "Cuộc thi hiện không nhận thêm người tham gia",
  "already joined this contest": "Bạn đã tham gia cuộc thi này",
  "you must join the contest before submitting": "Bạn cần tham gia cuộc thi trước khi nộp bài",
  "cannot send gift to yourself": "Không thể tự tặng quà cho chính mình",
  "not enrolled in this course": "Bạn chưa đăng ký khoá học này",
  "not enrolled in the course containing this lesson": "Bạn chưa đăng ký khoá học chứa bài học này",
  "payment required for this course": "Khoá học này cần thanh toán trước khi học",
  // enrollment_handler.go gửi `message: "LESSON_LOCKED"` (không phải "lesson locked" của service).
  lesson_locked: "Bài học đang bị khoá",
  "course must be completed before issuing a certificate": "Cần hoàn thành khoá học trước khi nhận chứng chỉ",
  "certificate already issued for this course": "Chứng chỉ của khoá học này đã được cấp",
  // Luồng coupon cũ (coupon_repository.go) không còn được gọi; order_service làm phẳng mọi lỗi
  // mã giảm giá thành "invalid coupon".
  "invalid coupon": "Mã giảm giá không hợp lệ",
  "voucher not found": "Mã voucher không tồn tại, vui lòng kiểm tra lại",
  "voucher is expired": "Voucher đã hết hạn",
  "voucher is inactive": "Voucher đang tạm ngưng",
  "voucher is not started yet": "Voucher chưa đến thời gian áp dụng",
  "voucher usage limit exceeded": "Voucher đã hết lượt sử dụng",
  "voucher usage limit per user exceeded": "Bạn đã dùng hết lượt của voucher này",
  "order does not meet minimum purchase requirement": "Đơn hàng chưa đạt giá trị tối thiểu để dùng mã",
  "order already cancelled": "Đơn hàng đã bị huỷ",
  "order already completed": "Đơn hàng đã hoàn tất",
  // admin_order_handler.go (hoàn tiền) đặt mã máy vào `error`.
  already_refunded: "Đơn hàng đã được hoàn tiền",
  invalid_status: "Trạng thái hiện tại không cho phép thao tác này",
  not_found: NOT_FOUND_MESSAGE,
  "no courses selected": "Bạn chưa chọn khoá học nào",
  "insufficient balance": "Số dư không đủ",
  // withdrawal_handler.go đặt mã máy vào `error` (message tiếng Anh không bao giờ tới đây).
  invalid_amount: "Số tiền phải lớn hơn 0",
  below_minimum: "Số tiền thấp hơn mức rút tối thiểu",
  bank_info_required: "Vui lòng cập nhật thông tin ngân hàng trước khi rút tiền",
  insufficient_balance: "Số tiền vượt quá số dư khả dụng",
  negative_balance: "Số dư đang âm, tạm thời chưa thể rút tiền",
  withdrawal_already_open: "Bạn đang có một yêu cầu rút tiền chờ xử lý",
  teacher_profile_required: "Bạn cần có hồ sơ giảng viên để rút tiền",
  withdrawal_not_found: "Không tìm thấy yêu cầu rút tiền",
  invalid_status_transition: "Yêu cầu đã được xử lý trước đó, vui lòng tải lại trang",
  "bank_name, bank_account_number, and bank_account_name are required":
    "Vui lòng nhập đủ tên ngân hàng, số tài khoản và tên chủ tài khoản",
  "teacher profile not found": "Bạn chưa có hồ sơ giảng viên",
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
  "this role cannot be self-assigned": "Vai trò này không thể tự đăng ký",
  "idempotency key already claimed by a concurrent request": "Yêu cầu đang được xử lý, vui lòng đợi",
};

// Mẫu tổng quát cho nhóm lỗi lặp lại hàng trăm biến thể ("x not found", "invalid x_id"...).
const PATTERN_MESSAGES: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/invalid OTP,\s*(\d+)\s*attempts?\s*remaining/i, (m) => `Mã OTP không đúng, còn ${m[1]} lần thử`],
  // auth_service.go:367 — khoá tạm vì sai mật khẩu nhiều lần (401, không có code).
  [
    /account temporarily locked.*try again in\s*(\d+)\s*minutes?/i,
    (m) => `Tài khoản tạm khoá do nhập sai nhiều lần, vui lòng thử lại sau ${m[1]} phút`,
  ],
  [/please login again|session expired|invalid or expired refresh token/i, () => SESSION_EXPIRED_MESSAGE],
  [/^forbidden|not the (owner|teacher)|insufficient permissions|does not belong to you/i, () => FORBIDDEN_MESSAGE],
  [/not found/i, () => NOT_FOUND_MESSAGE],
  [/^invalid |uuid|format|expected rfc3339|expected yyyy/i, () => INVALID_INPUT_MESSAGE],
];

const STATUS_MESSAGES: Record<number, string> = {
  400: "Yêu cầu không hợp lệ, vui lòng kiểm tra lại thông tin",
  401: SESSION_EXPIRED_MESSAGE,
  403: FORBIDDEN_MESSAGE,
  404: NOT_FOUND_MESSAGE,
  409: CONFLICT_MESSAGE,
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
  if (byCode && !GENERIC_CODES.has(code as string)) return byCode;

  const raw = (message ?? "").trim();
  if (raw) {
    const exact = EXACT_MESSAGES[raw.toLowerCase()];
    if (exact) return exact;
    // Backend đã trả tiếng Việt (vd. "coupon_code đã hết hạn") → giữ nguyên, đó là lý do thật.
    // Kiểm TRƯỚC mẫu: câu tiếng Việt chứa "not found"/"invalid" ở tên field không được bị đè.
    if (HAS_VIETNAMESE_DIACRITICS.test(raw)) return raw;
    // 401 của auth_middleware.go ("Invalid or expired token", "Invalid token type") là hết phiên.
    // Phải xét trước mẫu `^invalid `, nếu không người dùng thấy "Dữ liệu gửi lên không hợp lệ"
    // cùng lúc với toast "Phiên đăng nhập đã hết hạn" của bootstrap. Chỉ áp dụng cho 401: cùng
    // câu đó ở parent_invitation_handler.go là token LỜI MỜI, không phải phiên.
    if (status === 401 && /\btoken\b/i.test(raw)) return SESSION_EXPIRED_MESSAGE;
    for (const [pattern, toMessage] of PATTERN_MESSAGES) {
      const match = raw.match(pattern);
      if (match) return toMessage(match);
    }
  }

  if (byCode) return byCode;
  // Không khớp bảng: câu dự phòng của nơi gọi (biết ngữ cảnh, vd. "Không thể thêm học viên"), rồi
  // câu Việt chung theo status. KHÔNG in nguyên văn tiếng Anh: không phân biệt được lý do nghiệp
  // vụ với chuỗi kỹ thuật ("Unprocessable Entity", "context canceled", "value too long for type
  // character varying(255)"...) — chủ dự án chốt UI luôn tiếng Việt (re-review PR #33). Lỗi nghiệp
  // vụ người dùng cần biết phải có entry trong EXACT_MESSAGES.
  return fallback ?? STATUS_MESSAGES[status] ?? GENERIC_ERROR_MESSAGE;
}

/** Câu tiếng Việt để hiển thị cho MỌI loại lỗi (toast, dòng lỗi dưới form, trang lỗi). */
/** Mã 403 khi gửi/sửa/xoá tin trong DM 1-1 mà một bên đã chặn bên kia. */
export const CONVERSATION_BLOCKED_CODE = "ERR_CONVERSATION_BLOCKED";
export const CONVERSATION_BLOCKED_MESSAGE = "Không thể gửi tin nhắn trong cuộc trò chuyện này";

export function isConversationBlockedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403 && error.code === CONVERSATION_BLOCKED_CODE;
}

/** 45 -> "45 giây", 300 -> "5 phút", 90 -> "2 phút" (làm tròn lên để không hẹn sớm hơn thực tế). */
export function formatWaitDuration(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)} giây`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} phút`;
  if (seconds < 86400) return `${Math.ceil(seconds / 3600)} giờ`;
  return `${Math.ceil(seconds / 86400)} ngày`;
}

export function getErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof NetworkError) return NETWORK_ERROR_MESSAGE;
  // RateLimitError tự dựng câu tiếng Việt kèm số giây (lib/errors.ts).
  if (error instanceof RateLimitError) return error.message;
  if (error instanceof ApiError) {
    // 5xx: api-client đã thay message bằng câu chung; không đọc thêm gì từ backend.
    if (error.status >= 500) return fallback ?? GENERIC_ERROR_MESSAGE;
    // Cooldown lời mời: nếu backend cho biết phải chờ bao lâu thì nói luôn, vẫn không lộ lý do (từ chối hay huỷ).
    const wait = (error as { retryAfter?: number }).retryAfter;
    if (error.code === "FRIEND_REQUEST_COOLDOWN" && typeof wait === "number" && wait > 0) {
      return `Bạn chưa thể gửi lời mời cho người này lúc này. Hãy thử lại sau ${formatWaitDuration(wait)}.`;
    }
    return translateApiErrorMessage(error.status, error.code, error.message, fallback);
  }
  if (error instanceof Error && HAS_VIETNAMESE_DIACRITICS.test(error.message)) return error.message;
  return fallback ?? GENERIC_ERROR_MESSAGE;
}
