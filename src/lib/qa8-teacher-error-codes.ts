/**
 * Mã lỗi hợp đồng backend QA8 (giảng viên) và câu tiếng Việt dự phòng. Tách file như contract-error-codes.ts để bảng chính
 * (error-messages.ts) chỉ thêm một dòng trải ở cuối, các lane QA8 khác cùng sửa bảng đó không đụng nhau. Câu của backend
 * (tiếng Việt, nói rõ do số dư hay do yêu cầu rút) được ưu tiên, câu ở đây chỉ dùng khi backend gửi message tiếng Anh.
 */
export const QA8_TEACHER_CODE_MESSAGES: Record<string, string> = {
  // C22: DELETE /auth/me của giảng viên còn số dư ví hoặc yêu cầu rút đang chờ -> 409.
  ERR_ACCOUNT_HAS_BALANCE:
    "Bạn còn số dư trong ví hoặc yêu cầu rút tiền đang chờ nên chưa thể xoá tài khoản. Hãy rút hết số dư hoặc huỷ yêu cầu rút trước.",
};

/** Mã mà message tiếng Việt của backend nói lý do cụ thể hơn câu dự phòng: xét message trước. */
export const QA8_TEACHER_MESSAGE_FIRST_CODES: readonly string[] = ["ERR_ACCOUNT_HAS_BALANCE"];
