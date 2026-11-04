import { describe, expect, it } from "vitest";
import { validateRegisterForm, type RegisterFormData } from "./register-validation";

const valid: RegisterFormData = {
  username: "qa_user",
  firstName: "A",
  lastName: "Nguyễn",
  email: "a@example.com",
  password: "abcdefgh",
  confirmPassword: "abcdefgh",
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
    expect(errors.password).toMatch(/ít nhất 8 ký tự/);
    expect(errors.confirmPassword).toBe("Mật khẩu không khớp");
  });

  it("rejects a malformed email and a mismatched confirmation", () => {
    const errors = validateRegisterForm({ ...valid, email: "nope", confirmPassword: "x" });
    expect(errors.email).toMatch(/không đúng định dạng/);
    expect(errors.confirmPassword).toBe("Mật khẩu không khớp");
  });
});
