/**
 * Mã lỗi của hợp đồng backend QA3 (40-Study/backend#142, #143) và câu tiếng Việt dự phòng cho từng mã.
 * Tách khỏi error-messages.ts để bảng chính chỉ nhận thêm hai dòng trải (`...`), nên các PR khác cùng sửa bảng đó
 * không đụng nhau. Quy ước chung của bảng chính vẫn giữ: câu tiếng Việt của backend được ưu tiên, câu ở đây chỉ
 * dùng khi backend gửi message tiếng Anh hoặc không gửi message.
 */

export const CONTRACT_CODE_MESSAGES: Record<string, string> = {
  // Livestream chưa cấu hình LiveKit: 503 từ /livestream/:id/start và /join.
  ERR_LIVE_UNAVAILABLE: "Dịch vụ học trực tuyến hiện chưa sẵn sàng. Vui lòng thử lại sau.",
  // Khoá có phí mà giá <= 0: 400 khi tạo/sửa khoá.
  PAID_COURSE_PRICE_INVALID:
    "Khoá học có phí cần có giá lớn hơn 0. Hãy nhập giá bán hoặc chuyển sang khoá miễn phí.",
  // 422 khi gửi duyệt thiếu ảnh bìa / mô tả / giá. Danh sách mục thiếu do approval-errors.ts ghép từ `missing[]`.
  COURSE_INCOMPLETE: "Khoá học chưa đủ thông tin để gửi duyệt.",
  ROLE_NAME_TAKEN: "Tên vai trò đã tồn tại trong tổ chức.",
  ORG_ROLE_ALREADY_ASSIGNED: "Người này đã giữ vai trò đó trong tổ chức.",
  ERR_INVALID_VOUCHER_CODE:
    "Mã voucher chỉ gồm chữ in hoa không dấu, chữ số, dấu gạch ngang và gạch dưới.",
  // Huỷ đơn (xem cancelOrderErrorMessage trong use-orders.ts cho câu theo ngữ cảnh huỷ).
  ERR_ORDER_ALREADY_PAID: "Đơn hàng này đã được thanh toán.",
  ERR_PAYMENT_PROVIDER_UNAVAILABLE:
    "Ngân hàng đang gặp sự cố nên chưa kiểm tra được giao dịch. Vui lòng thử lại sau ít phút.",
};

/** Các mã mà message tiếng Việt của backend nói lý do cụ thể hơn câu dự phòng: xét message trước. */
export const CONTRACT_MESSAGE_FIRST_CODES: readonly string[] = [
  "ERR_LIVE_UNAVAILABLE",
  "PAID_COURSE_PRICE_INVALID",
  "COURSE_INCOMPLETE",
  "ROLE_NAME_TAKEN",
  "ORG_ROLE_ALREADY_ASSIGNED",
  "ERR_INVALID_VOUCHER_CODE",
  "ERR_ORDER_ALREADY_PAID",
  "ERR_PAYMENT_PROVIDER_UNAVAILABLE",
];

/**
 * Lỗi 5xx mà message backend là câu tiếng Việt viết cho người dùng (dịch vụ ngoài chưa sẵn sàng), nên không bị
 * thay bằng câu chung "Có lỗi xảy ra". Chỉ thêm mã vào đây khi handler backend KHÔNG đưa chi tiết kỹ thuật vào message.
 */
const USER_FACING_SERVER_ERROR_CODES: ReadonlySet<string> = new Set([
  "ERR_LIVE_UNAVAILABLE",
  "ERR_PAYMENT_PROVIDER_UNAVAILABLE",
]);

export function isUserFacingServerErrorCode(code: string | undefined): boolean {
  return code !== undefined && USER_FACING_SERVER_ERROR_CODES.has(code);
}
