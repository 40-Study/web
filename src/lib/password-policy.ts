/**
 * Chính sách mật khẩu MỚI, một nguồn duy nhất cho đăng ký (form + modal), đặt lại mật khẩu và đổi mật khẩu (QA3 P-04).
 * Phản chiếu `utils.IsStrongPassword` của backend (40-Study/backend#143): tối thiểu 8 ký tự, tối đa 72, có ít nhất
 * 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt (không phải chữ, không phải số, không phải khoảng trắng). Đăng nhập
 * KHÔNG dùng luật này (mật khẩu yếu cũ vẫn vào được). Đổi luật phải đổi cả backend.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

/** Cùng câu với backend `utils.PasswordPolicyMessage` (errors[].tag = "strong_password"). */
export const PASSWORD_POLICY_MESSAGE =
  "Mật khẩu phải có ít nhất 8 ký tự, gồm ít nhất 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt";
export const PASSWORD_TOO_LONG_MESSAGE = `Mật khẩu tối đa ${PASSWORD_MAX_LENGTH} ký tự`;

export interface PasswordRule {
  id: "length" | "upper" | "digit" | "special";
  label: string;
  test: (password: string) => boolean;
}

type CharClass = "upper" | "digit" | "other";

/** Cùng thứ tự phân loại với backend: hoa -> số -> (chữ thường | khoảng trắng) -> còn lại là ký tự đặc biệt. */
function classify(char: string): CharClass | "special" {
  if (/\p{Lu}/u.test(char)) return "upper";
  if (/\p{Nd}/u.test(char)) return "digit";
  if (/\p{L}/u.test(char) || /\p{White_Space}/u.test(char)) return "other";
  return "special";
}

function has(password: string, wanted: CharClass | "special"): boolean {
  for (const char of password) if (classify(char) === wanted) return true;
  return false;
}

/** Số ký tự theo code point (backend đếm rune), không phải UTF-16. */
export function passwordLength(password: string): number {
  return [...password].length;
}

/** Đúng 4 luật hiển thị trong checklist; thứ tự = thứ tự câu thông báo của backend. */
export const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: "length", label: `Ít nhất ${PASSWORD_MIN_LENGTH} ký tự`, test: (p) => passwordLength(p) >= PASSWORD_MIN_LENGTH },
  { id: "upper", label: "Có ít nhất 1 chữ in hoa", test: (p) => has(p, "upper") },
  { id: "digit", label: "Có ít nhất 1 chữ số", test: (p) => has(p, "digit") },
  { id: "special", label: "Có ít nhất 1 ký tự đặc biệt (không phải chữ, số hay khoảng trắng)", test: (p) => has(p, "special") },
];

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

/** Lỗi cho mật khẩu MỚI, hoặc `undefined` khi hợp lệ. Mật khẩu rỗng do nơi gọi tự báo "Vui lòng nhập...". */
export function validateNewPassword(password: string): string | undefined {
  if (passwordLength(password) > PASSWORD_MAX_LENGTH) return PASSWORD_TOO_LONG_MESSAGE;
  return isStrongPassword(password) ? undefined : PASSWORD_POLICY_MESSAGE;
}
