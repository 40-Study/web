import { describe, expect, it } from "vitest";
import { sanitizeRedirect } from "./safe-redirect";

describe("sanitizeRedirect — chỉ nhận đường dẫn nội bộ", () => {
  it.each(["/my-courses", "/my-courses?tab=done", "/courses/abc#reviews", "/"])("giữ %s", (value) => {
    expect(sanitizeRedirect(value)).toBe(value);
  });

  it.each([
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "http://evil.com/path",
    "javascript:alert(1)",
    "evil.com",
    "/\t/evil.com",
    " /my-courses",
    "",
    null,
    undefined,
  ])("bỏ %j", (value) => {
    expect(sanitizeRedirect(value)).toBeNull();
  });
});
