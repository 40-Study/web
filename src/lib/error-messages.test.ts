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

  it("ASCII không có trong bảng (vd. lỗi GORM) -> câu chung theo status, không in nguyên văn", () => {
    const error = new ApiError(409, "UNKNOWN", "ERROR: could not serialize access due to concurrent update");
    expect(getErrorMessage(error)).toBe("Dữ liệu vừa thay đổi, vui lòng tải lại trang rồi thử lại");
  });

  it("message backend đã là tiếng Việt -> giữ nguyên (đó là lý do thật)", () => {
    expect(getErrorMessage(new ApiError(400, "UNKNOWN", "coupon_code đã hết hạn"))).toBe(
      "coupon_code đã hết hạn"
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
