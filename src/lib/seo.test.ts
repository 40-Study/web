import { describe, expect, it, vi } from "vitest";
import { SITE_URL_REQUIRED_MESSAGE, resolveSiteUrl } from "./seo";

// G-10 (QA3 261104): thiếu NEXT_PUBLIC_SITE_URL từng làm sitemap/robots ra `http://localhost:3000` mà không báo gì.
describe("resolveSiteUrl", () => {
  it("production không có env -> ném lỗi nêu tên biến, không rơi về localhost", () => {
    expect(() => resolveSiteUrl(undefined, "production")).toThrow(SITE_URL_REQUIRED_MESSAGE);
    expect(() => resolveSiteUrl("   ", "production")).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("có env -> dùng, bỏ dấu / cuối", () => {
    expect(resolveSiteUrl("https://fortex.example/", "production")).toBe("https://fortex.example");
  });

  it("env không phải URL tuyệt đối -> ném lỗi (không để sitemap sinh <loc> hỏng)", () => {
    expect(() => resolveSiteUrl("fortex.example", "production")).toThrow(/không phải URL hợp lệ/);
  });

  it("dev không có env -> localhost kèm cảnh báo", () => {
    const warn = vi.fn();
    expect(resolveSiteUrl(undefined, "development", warn)).toBe("http://localhost:3000");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("NEXT_PUBLIC_SITE_URL");
  });

  it("test không có env -> localhost, im lặng", () => {
    const warn = vi.fn();
    expect(resolveSiteUrl(undefined, "test", warn)).toBe("http://localhost:3000");
    expect(warn).not.toHaveBeenCalled();
  });
});
