import { describe, expect, it } from "vitest";
import { ApiError, AuthError, ForbiddenError, NetworkError, NotFoundError, RateLimitError } from "./errors";
import { getErrorMessage, GENERIC_ERROR_MESSAGE } from "./error-messages";

// QA vòng 2 (N9, P-N1, N-13, N13): mọi lỗi hiển thị cho người dùng phải là tiếng Việt, không lộ
// chuỗi kỹ thuật tiếng Anh của backend.
describe("getErrorMessage — ánh xạ lỗi backend sang tiếng Việt", () => {
  it("400 'incorrect current password' (đổi mật khẩu sai) -> 'Mật khẩu hiện tại không đúng'", () => {
    const error = new ApiError(400, "UNKNOWN", "incorrect current password");
    expect(getErrorMessage(error)).toBe("Mật khẩu hiện tại không đúng");
  });

  it("chuỗi kỹ thuật 'invalid UUID length: 14' không bao giờ lộ ra", () => {
    const message = getErrorMessage(new ApiError(400, "UNKNOWN", "invalid UUID length: 14"));
    expect(message).not.toMatch(/uuid/i);
    expect(message).toBe("Dữ liệu gửi lên không hợp lệ, vui lòng kiểm tra lại");
  });

  it("ASCII kỹ thuật không có trong bảng (vd. lỗi GORM) -> câu chung theo status, không in nguyên văn", () => {
    const error = new ApiError(409, "UNKNOWN", "ERROR: could not serialize access due to concurrent update");
    const message = getErrorMessage(error);
    expect(message).toBe("Thao tác xung đột với dữ liệu hiện có");
    expect(message).not.toMatch(/tải lại trang/);
  });

  it("message backend đã là tiếng Việt -> giữ nguyên (đó là lý do thật)", () => {
    expect(getErrorMessage(new ApiError(400, "UNKNOWN", "coupon_code đã hết hạn"))).toBe(
      "coupon_code đã hết hạn"
    );
  });

  // Lane S3: backend trả 403 khi người dùng thấy bài tập nhưng không phải chủ, 404 khi không xem được.
  it("assignment: 403 'forbidden: only the owning teacher...' và 404 'assignment not found'", () => {
    expect(
      getErrorMessage(
        new ForbiddenError("forbidden: only the owning teacher or an admin can modify this assignment"),
        "Không thể cập nhật bài tập"
      )
    ).toBe("Bạn không có quyền thực hiện thao tác này");
    expect(getErrorMessage(new NotFoundError("assignment not found"), "Không thể cập nhật bài tập")).toBe(
      "Không tìm thấy dữ liệu, có thể đã bị xoá"
    );
  });

  it("mẫu 'x not found' / 'forbidden: ...' / 'please login again'", () => {
    expect(getErrorMessage(new NotFoundError("lesson not found"))).toBe(
      "Không tìm thấy dữ liệu, có thể đã bị xoá"
    );
    expect(getErrorMessage(new ForbiddenError("forbidden: not the owner"))).toBe(
      "Bạn không có quyền thực hiện thao tác này"
    );
    expect(getErrorMessage(new AuthError("Please login again"))).toBe(
      "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"
    );
  });

  it("OTP sai còn N lần thử -> giữ số lần", () => {
    expect(getErrorMessage(new ApiError(400, "UNKNOWN", "invalid OTP, 4 attempts remaining"))).toBe(
      "Mã OTP không đúng, còn 4 lần thử"
    );
  });

  it("ưu tiên theo code (ACCOUNT_LOCKED) hơn message tiếng Anh 'Please login again'", () => {
    expect(getErrorMessage(new AuthError("Please login again", "ACCOUNT_LOCKED"))).toBe(
      "Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên."
    );
  });

  it("fallback của nơi gọi thay cho câu chung theo status", () => {
    expect(getErrorMessage(new ApiError(400, "UNKNOWN", "weird"), "Không thể tạo đơn")).toBe(
      "Không thể tạo đơn"
    );
  });

  // Review PR #33 (MAJOR): chuỗi lấy nguyên văn từ backend/internal (service trả err.Error()).
  it.each([
    [409, "course already in cart", "Khoá học đã có trong giỏ hàng"],
    [409, "you are already enrolled in this course", "Bạn đã đăng ký khoá học này"],
    [409, "you have already reviewed this course", "Bạn đã đánh giá khoá học này rồi"],
    [400, "student is already enrolled in this class", "Học viên này đã có trong lớp"],
    [400, "you are banned from this group", "Bạn đã bị chặn khỏi nhóm này"],
    [400, "contest is full", "Cuộc thi đã đủ người tham gia"],
    [400, "cannot send gift to yourself", "Không thể tự tặng quà cho chính mình"],
  ])("%i '%s' -> câu nghiệp vụ tiếng Việt", (status, raw, expected) => {
    expect(getErrorMessage(new ApiError(status, "UNKNOWN", raw))).toBe(expected);
  });

  // Re-review PR #33 (chủ dự án chốt): toast KHÔNG bao giờ hiện câu tiếng Anh thô.
  it.each([
    [400, "Unprocessable Entity", "Yêu cầu không hợp lệ, vui lòng kiểm tra lại thông tin"],
    [400, "Bad Request", "Yêu cầu không hợp lệ, vui lòng kiểm tra lại thông tin"],
    [400, "context canceled", "Yêu cầu không hợp lệ, vui lòng kiểm tra lại thông tin"],
    [400, "failed to create order", "Yêu cầu không hợp lệ, vui lòng kiểm tra lại thông tin"],
    [400, "value too long for type character varying(255)", "Yêu cầu không hợp lệ, vui lòng kiểm tra lại thông tin"],
    [409, "achievement already unlocked", "Thao tác xung đột với dữ liệu hiện có"],
    [409, "failed to create order", "Thao tác xung đột với dữ liệu hiện có"],
  ])("%i '%s' không có trong bảng -> câu Việt chung, không in tiếng Anh", (status, raw, expected) => {
    const message = getErrorMessage(new ApiError(status, "UNKNOWN", raw));
    expect(message).toBe(expected);
    expect(message).not.toContain(raw);
  });

  it("400/409 không có trong bảng + nơi gọi có fallback -> dùng fallback", () => {
    expect(getErrorMessage(new ApiError(400, "UNKNOWN", "member is not banned"), "Không thể bỏ chặn")).toBe(
      "Không thể bỏ chặn"
    );
    expect(getErrorMessage(new ApiError(409, "UNKNOWN", "Unprocessable Entity"), "Không thể lưu")).toBe(
      "Không thể lưu"
    );
  });

  it("400/409 message backend có dấu tiếng Việt -> giữ nguyên văn", () => {
    expect(getErrorMessage(new ApiError(409, "UNKNOWN", "Lớp đã khoá đăng ký"), "Không thể lưu")).toBe(
      "Lớp đã khoá đăng ký"
    );
  });

  it("khoá theo chuỗi client thật sự nhận: mã máy trong `error` / `message`", () => {
    expect(getErrorMessage(new ApiError(409, "UNKNOWN", "withdrawal_already_open"))).toBe(
      "Bạn đang có một yêu cầu rút tiền chờ xử lý"
    );
    expect(getErrorMessage(new ApiError(403, "UNKNOWN", "LESSON_LOCKED"))).toBe("Bài học đang bị khoá");
    expect(getErrorMessage(new ApiError(409, "UNKNOWN", "already_refunded"))).toBe("Đơn hàng đã được hoàn tiền");
  });

  it("code chung (ERR_NOT_FOUND, ERR_VALIDATION) -> message cụ thể được xét trước code", () => {
    expect(getErrorMessage(new ApiError(404, "ERR_NOT_FOUND", "Voucher not found"))).toBe(
      "Mã voucher không tồn tại, vui lòng kiểm tra lại"
    );
    expect(
      getErrorMessage(
        new ApiError(400, "ERR_VALIDATION", "bank_name, bank_account_number, and bank_account_name are required")
      )
    ).toBe("Vui lòng nhập đủ tên ngân hàng, số tài khoản và tên chủ tài khoản");
    // message không khớp gì -> vẫn dùng câu của code, không lộ chuỗi kỹ thuật
    expect(getErrorMessage(new ApiError(400, "ERR_VALIDATION", "Key: 'Req.Name' Error:required"))).toBe(
      "Dữ liệu gửi lên không hợp lệ, vui lòng kiểm tra lại"
    );
  });

  it("401 'Invalid or expired token' của middleware -> hết phiên, không phải 'dữ liệu không hợp lệ'", () => {
    expect(getErrorMessage(new AuthError("Invalid or expired token"))).toBe(
      "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"
    );
    // cùng câu nhưng 400 (token lời mời) -> không phải hết phiên
    expect(getErrorMessage(new ApiError(400, "UNKNOWN", "Invalid or expired token"))).not.toMatch(/Phiên/);
  });

  it("khoá tạm vì sai mật khẩu nhiều lần -> giữ số phút", () => {
    expect(
      getErrorMessage(
        new AuthError("account temporarily locked due to too many failed attempts, try again in 15 minutes")
      )
    ).toBe("Tài khoản tạm khoá do nhập sai nhiều lần, vui lòng thử lại sau 15 phút");
  });

  it("mất mạng, 429 kèm số giây, 5xx và lỗi lạ", () => {
    expect(getErrorMessage(new NetworkError())).toMatch(/Mất kết nối/);
    expect(getErrorMessage(new RateLimitError(42))).toBe(
      "Bạn thao tác quá nhiều lần, vui lòng thử lại sau 42 giây"
    );
    expect(getErrorMessage(new ApiError(500, "UNKNOWN", "pq: duplicate key"))).toBe(GENERIC_ERROR_MESSAGE);
    expect(getErrorMessage(new Error("Something went wrong"))).toBe(GENERIC_ERROR_MESSAGE);
    expect(getErrorMessage("boom")).toBe(GENERIC_ERROR_MESSAGE);
  });
});

// W2-A: gán giảng viên ngoài tổ chức vào lớp của tổ chức trả 400 kèm code ổn định; web dịch theo code, không theo câu tiếng Anh.
describe("getErrorMessage - TEACHER_NOT_ORG_MEMBER", () => {
  it("dịch theo code sang câu tiếng Việt chỉ rõ cách xử lý", () => {
    const error = new ApiError(400, "TEACHER_NOT_ORG_MEMBER", "teacher is not an active member of this class's organization");
    const message = getErrorMessage(error);
    expect(message).toMatch(/thành viên của tổ chức/);
    expect(message).not.toMatch(/teacher/i);
  });
});
describe("getErrorMessage — ghi vào lớp đã lưu trữ (409 CLASS_ARCHIVED)", () => {
  it("backend đã trả message tiếng Việt: hiện đúng message của backend", () => {
    const error = new ApiError(409, "CLASS_ARCHIVED", "Lớp đã lưu trữ, hãy mở lại lớp trước khi chỉnh sửa");
    expect(getErrorMessage(error)).toBe("Lớp đã lưu trữ, hãy mở lại lớp trước khi chỉnh sửa");
  });

  it("message không có tiếng Việt: dùng câu dự phòng theo code, không in tiếng Anh, không là câu xung đột chung", () => {
    const message = getErrorMessage(new ApiError(409, "CLASS_ARCHIVED", "class is archived"));
    expect(message).toMatch(/Lớp đã lưu trữ/);
    expect(message).not.toMatch(/archived/i);
  });
});

// QA 261008 T3/T4: quiz_handler/quiz_question_validation trả 400 tiếng Anh; modal "Thêm nội dung" hiện
// thẳng câu này, nên phải ra tiếng Việt đúng lý do thay vì câu chung "Dữ liệu gửi lên không hợp lệ".
describe("getErrorMessage — thêm nội dung bài học (T3/T4)", () => {
  it("400 'title is required' -> nhắc nhập tiêu đề", () => {
    expect(getErrorMessage(new ApiError(400, "UNKNOWN", "title is required"))).toBe("Vui lòng nhập tiêu đề");
  });

  it.each([
    "invalid question answers: multiple_choice question must have at least 1 correct answer (got 0)",
    "invalid question answers: single_choice question must have exactly 1 correct answer (got 0)",
  ])("400 thiếu đáp án đúng (%s) -> nói đúng lý do, không phải câu chung", (raw) => {
    const message = getErrorMessage(new ApiError(400, "UNKNOWN", raw));
    expect(message).toBe("Mỗi câu hỏi trắc nghiệm cần có đáp án đúng trước khi lưu");
  });
});
