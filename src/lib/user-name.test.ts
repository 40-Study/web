import { describe, expect, it } from "vitest";
import { USER_NAME_RULE_MESSAGE, validateUserName } from "./user-name";

describe("validateUserName (một luật cho đăng ký và sửa hồ sơ)", () => {
  it.each(["student1_qa", "student123", "_ab", "abc", "a".repeat(30)])("chấp nhận %s", (name) => {
    expect(validateUserName(name)).toBeNull();
  });

  it.each([
    ["quá ngắn", "ab"],
    ["quá dài (31)", "a".repeat(31)],
    ["email", "tvanle.dev@gmail.com"],
    ["có @", "abc@def"],
    ["có dấu chấm", "abc.def"],
    ["có khoảng trắng", "abc def"],
    ["có dấu tiếng Việt", "nguyễnvăn"],
    ["có gạch ngang", "a-b-c"],
    ["rỗng", ""],
  ])("từ chối %s", (_label, name) => {
    expect(validateUserName(name)).toBe(USER_NAME_RULE_MESSAGE);
  });
});
