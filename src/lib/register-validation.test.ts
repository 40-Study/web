import { describe, expect, it } from "vitest";
import { PASSWORD_POLICY_MESSAGE } from "./password-policy";
import { ApiError } from "./errors";
import { mapRegisterServerError, validateRegisterForm, type RegisterFormData } from "./register-validation";
import { USERNAME_TAKEN_MESSAGE } from "./user-name";

const valid: RegisterFormData = {
  username: "qa_user",
  firstName: "A",
  lastName: "Nguyễn",
  email: "a@example.com",
  password: "Abcdef1!",
  confirmPassword: "Abcdef1!",
};

describe("validateRegisterForm", () => {
  it("returns no keys for a valid form", () => {
    expect(validateRegisterForm(valid)).toEqual({});
  });

  it("returns Vietnamese per-field errors for an empty form", () => {
    const errors = validateRegisterForm({ ...valid, username: "", firstName: "", lastName: "", email: "", password: "" });
    expect(errors.username).toBe("Vui lòng nhập tên đăng nhập");
    expect(errors.lastName).toBe("Vui lòng nhập họ");
    expect(errors.firstName).toBe("Vui lòng nhập tên");
    expect(errors.email).toBe("Vui lòng nhập email");
    // Q5-PG-12: ô trống nói "Vui lòng nhập ..." như các ô khác, không in cả câu chính sách.
    expect(errors.password).toBe("Vui lòng nhập mật khẩu");
    expect(errors.confirmPassword).toBe("Mật khẩu không khớp");
  });

  // P-04: luật cũ chỉ kiểm độ dài nên "abcdefgh" lọt qua form rồi mới bị backend từ chối.
  it.each(["abcdefgh", "Abcdefg1", "abcdef1!", "Abcdefg!", "Ab1!"])("rejects weak password %s before calling the API", (password) => {
    const errors = validateRegisterForm({ ...valid, password, confirmPassword: password });
    expect(errors.password).toBe(PASSWORD_POLICY_MESSAGE);
  });

  it("rejects a malformed email and a mismatched confirmation", () => {
    const errors = validateRegisterForm({ ...valid, email: "nope", confirmPassword: "x" });
    expect(errors.email).toMatch(/không đúng định dạng/);
    expect(errors.confirmPassword).toBe("Mật khẩu không khớp");
  });
});

describe("validateRegisterForm — độ dài Họ/Tên (Q8-PG-07)", () => {
  it("Họ hoặc Tên quá 100 ký tự: lỗi tiếng Việt ngay ở ô đó, không đợi backend 400 tiếng Anh", () => {
    const errors = validateRegisterForm({ ...valid, lastName: "N".repeat(101), firstName: "A".repeat(101) });
    expect(errors.lastName).toBe("Họ tối đa 100 ký tự");
    expect(errors.firstName).toBe("Tên tối đa 100 ký tự");
  });

  it("đúng 100 ký tự vẫn hợp lệ", () => {
    expect(validateRegisterForm({ ...valid, lastName: "N".repeat(100), firstName: "A".repeat(100) })).toEqual({});
  });
});

describe("mapRegisterServerError (Q8-PG-02, Q8-PG-07)", () => {
  const other = () => "Đăng ký thất bại. Vui lòng thử lại.";

  it("409 ERR_USERNAME_EXISTS: lỗi dưới ô Tên đăng nhập, không có câu chung", () => {
    const result = mapRegisterServerError(new ApiError(409, "ERR_USERNAME_EXISTS", "username already exists"), other);
    expect(result.fieldErrors.username).toBe(USERNAME_TAKEN_MESSAGE);
    expect(result.formError).toBe("");
  });

  it("400 kèm errors[{field:full_name}]: lỗi tiếng Việt dưới ô Họ, không in câu tiếng Anh của backend", () => {
    const body = { errors: [{ field: "full_name", message: "full_name must be at most 255 characters" }], message: "Validation failed" };
    const result = mapRegisterServerError(new ApiError(400, "UNKNOWN", "Validation failed", undefined, body), other);
    expect(result.fieldErrors.lastName).toContain("tối đa 100 ký tự");
    expect(JSON.stringify(result)).not.toMatch(/must be at most/);
    expect(result.formError).toBe("");
  });

  it("lỗi khác (email đã đăng ký, 5xx...) giữ câu chung", () => {
    const result = mapRegisterServerError(new ApiError(409, "UNKNOWN", "email already registered"), other);
    expect(result.fieldErrors).toEqual({});
    expect(result.formError).toBe("Đăng ký thất bại. Vui lòng thử lại.");
  });
});
