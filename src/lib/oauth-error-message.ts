/**
 * Q5-PG-06: backend và /oauth/callback đều chuyển về `/login?error=<chuỗi tiếng Anh tự do>` (lỗi của nhà
 * cung cấp, `err.Error()` của service) nhưng trang đăng nhập không đọc nên người dùng bị từ chối quyền hay
 * lỗi nhà cung cấp chỉ thấy trang đăng nhập im lặng. Chuỗi này đến từ URL, KHÔNG in thẳng lên màn hình: chỉ
 * nhận dạng vài mã đã biết rồi trả câu tiếng Việt cố định.
 */
const KNOWN: Array<[RegExp, string]> = [
  [/access[_ ]denied|user[_ ]denied|consent/i, "Bạn đã từ chối cấp quyền đăng nhập. Vui lòng thử lại nếu muốn tiếp tục."],
  [/unsupported oauth provider/i, "Phương thức đăng nhập này hiện chưa được hỗ trợ. Vui lòng dùng email và mật khẩu."],
  [/state|expired|invalid[_ ]grant/i, "Phiên đăng nhập đã hết hạn. Vui lòng thử đăng nhập lại."],
];

export const OAUTH_GENERIC_ERROR_MESSAGE =
  "Đăng nhập bằng tài khoản mạng xã hội không thành công. Vui lòng thử lại hoặc dùng email và mật khẩu.";

export function oauthErrorMessage(code: string): string {
  for (const [pattern, message] of KNOWN) {
    if (pattern.test(code)) return message;
  }
  return OAUTH_GENERIC_ERROR_MESSAGE;
}
