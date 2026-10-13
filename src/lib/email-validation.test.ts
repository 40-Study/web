import { describe, expect, it } from "vitest";
import { EMAIL_FORMAT_MESSAGE, EMAIL_REQUIRED_MESSAGE, validateEmail } from "./email-validation";

describe("validateEmail", () => {
  it.each(["", "   "])("rỗng (%j) -> yêu cầu nhập", (value) => {
    expect(validateEmail(value)).toBe(EMAIL_REQUIRED_MESSAGE);
  });

  it.each(["abc", "abc@", "@vidu.com", "a b@vidu.com", "ten@vidu", "a@@b.com"])("%j -> sai định dạng", (value) => {
    expect(validateEmail(value)).toBe(EMAIL_FORMAT_MESSAGE);
  });

  it.each(["ten@vidu.com", "  ten@vidu.com  ", "a.b+c@sub.vidu.vn"])("%j -> hợp lệ", (value) => {
    expect(validateEmail(value)).toBeUndefined();
  });
});
