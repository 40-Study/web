/**
 * Review m7: bỏ `sanitizeRedirect` ở middleware trước đây vẫn xanh (NextRequest đã chuẩn hoá
 * đường dẫn). Test gọi thẳng hàm dựng URL với đường dẫn chưa chuẩn hoá chứa `//`.
 */
import { describe, expect, it } from "vitest";
import { buildLoginRedirectUrl } from "./login-redirect";

const BASE = "http://localhost:3000/anything";

describe("buildLoginRedirectUrl", () => {
  it("đường dẫn nội bộ -> ?redirect= giữ cả query string", () => {
    const url = buildLoginRedirectUrl("/contests/thi-git/play", "?tab=1", BASE);
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("redirect")).toBe("/contests/thi-git/play?tab=1");
  });

  it.each(["//evil.com/x", "/\\evil.com", "/.//evil.com", "/%2e//evil.com", "/a\tb"])(
    "%s (sang host khác / ký tự điều khiển) -> KHÔNG gắn redirect",
    (pathname) => {
      const url = buildLoginRedirectUrl(pathname, "", BASE);
      expect(url.origin).toBe("http://localhost:3000");
      expect(url.pathname).toBe("/login");
      expect(url.searchParams.has("redirect")).toBe(false);
    }
  );
});
