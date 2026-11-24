import { describe, expect, it } from "vitest";
import { OAUTH_GENERIC_ERROR_MESSAGE, oauthErrorMessage } from "./oauth-error-message";

describe("oauthErrorMessage (Q5-PG-06)", () => {
  it.each([
    ["access_denied", /từ chối/],
    ["The user denied consent", /từ chối/],
    ["unsupported oauth provider: google", /chưa được hỗ trợ/],
    ["invalid oauth state", /hết hạn/],
  ])("%s -> câu tiếng Việt cố định", (code, expected) => {
    expect(oauthErrorMessage(code)).toMatch(expected);
  });

  it("mã lạ: câu chung, không in lại chuỗi tiếng Anh từ URL", () => {
    const msg = oauthErrorMessage("<b>boom</b> internal stack trace");
    expect(msg).toBe(OAUTH_GENERIC_ERROR_MESSAGE);
    expect(msg).not.toMatch(/boom|stack/);
  });
});
