import { describe, expect, it } from "vitest";
import { sanitizeRedirect } from "./safe-redirect";

describe("sanitizeRedirect — chỉ nhận đường dẫn nội bộ", () => {
  it.each(["/my-courses", "/my-courses?tab=done", "/courses/abc#reviews", "/"])("giữ %s", (value) => {
    expect(sanitizeRedirect(value)).toBe(value);
  });

  it("trả về đường dẫn đã chuẩn hoá (thứ được điều hướng = thứ đã kiểm)", () => {
    expect(sanitizeRedirect("/a/./b/../c?x=1#h")).toBe("/a/c?x=1#h");
  });

  it.each([
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "http://evil.com/path",
    "javascript:alert(1)",
    "evil.com",
    "/\t/evil.com",
    // Re-review PR #33: dot-segment được chuẩn hoá thành "//evil.com".
    "/.//evil.com",
    "/..//evil.com",
    "/%2e//evil.com",
    "/%2e%2e//evil.com",
    "/./\\evil.com",
    "/.\\/evil.com",
    "/a/..//evil.com",
    " /my-courses",
    "",
    null,
    undefined,
  ])("bỏ %j", (value) => {
    expect(sanitizeRedirect(value)).toBeNull();
  });
});
