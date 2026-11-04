import { describe, expect, it } from "vitest";
import { PASSWORD_POLICY_MESSAGE } from "./password-policy";
import { validateRegisterForm, type RegisterFormData } from "./register-validation";

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
    expect(errors.password).toBe(PASSWORD_POLICY_MESSAGE);
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
