import { describe, expect, it } from "vitest";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_POLICY_MESSAGE,
  PASSWORD_RULES,
  PASSWORD_TOO_LONG_MESSAGE,
  isStrongPassword,
  validateNewPassword,
} from "./password-policy";

/** Bản chép các ca của `TestIsStrongPassword` (backend#143, utils/password_policy_test.go). */
const BACKEND_CASES: Array<[string, boolean]> = [
  ["Abcdef1!", true],
  ["abcdefgh", false], // ca QA P-04: thiếu hoa, số, đặc biệt
  ["Abcdefg1", false], // thiếu đặc biệt
  ["abcdef1!", false], // thiếu hoa
  ["Abcdefg!", false], // thiếu số
  ["Ab1!", false], // ngắn
  ["Abcde 1 ", false], // khoảng trắng không phải ký tự đặc biệt
  ["Mật-khẩu1", true], // Unicode: hoa + số + '-'
  ["ResilientP4_", true],
];

describe("password-policy khớp luật backend", () => {
  it.each(BACKEND_CASES)("%s -> %s", (password, strong) => {
    expect(isStrongPassword(password)).toBe(strong);
    expect(validateNewPassword(password)).toBe(strong ? undefined : PASSWORD_POLICY_MESSAGE);
  });

  it("câu lỗi giống hệt câu backend gửi kèm strong_password", () => {
    expect(PASSWORD_POLICY_MESSAGE).toBe(
      "Mật khẩu phải có ít nhất 8 ký tự, gồm ít nhất 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt"
    );
  });

  it("đúng 4 luật, thứ tự: độ dài, hoa, số, đặc biệt", () => {
    expect(PASSWORD_RULES.map((rule) => rule.id)).toEqual(["length", "upper", "digit", "special"]);
  });

  it("tối đa 72 ký tự tính theo ký tự, không theo byte", () => {
    const base = "Aa1!";
    expect(validateNewPassword(base + "x".repeat(PASSWORD_MAX_LENGTH - base.length))).toBeUndefined();
    expect(validateNewPassword(base + "x".repeat(PASSWORD_MAX_LENGTH - base.length + 1))).toBe(PASSWORD_TOO_LONG_MESSAGE);
    // 70 chữ "ậ" (3 byte mỗi chữ) + "A1!" = 73 ký tự > 72
    expect(validateNewPassword("A1!" + "ậ".repeat(70))).toBe(PASSWORD_TOO_LONG_MESSAGE);
    expect(validateNewPassword("A1!" + "ậ".repeat(69))).toBeUndefined();
  });

  it("emoji (1 ký tự, 2 đơn vị UTF-16) tính là 1 ký tự và là ký tự đặc biệt", () => {
    expect(isStrongPassword("Abcdef1😀")).toBe(true);
    expect(PASSWORD_RULES[0].test("Ab1😀😀😀😀")).toBe(false); // 7 ký tự
    expect(PASSWORD_RULES[0].test("Ab1😀😀😀😀😀")).toBe(true); // 8 ký tự
  });
});
