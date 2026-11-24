/**
 * QA4 S3: ô truy cập nhanh "Trợ lý AI" trỏ /ai-chat, route chỉ redirect về /home
 * nên bấm vào chỉ tải lại trang chủ. Mọi ô phải trỏ tới một trang thật.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SHORTCUTS } from "./home-dashboard";

const APP_DIR = path.join(__dirname, "..", "..", "app", "(app)");

describe("Home quick-access shortcuts", () => {
  it("không còn ô AI", () => {
    expect(SHORTCUTS.map((s) => s.href)).not.toContain("/ai-chat");
    expect(SHORTCUTS.some((s) => /AI/.test(s.title))).toBe(false);
  });

  it("mỗi ô trỏ tới một trang có thật, không phải trang chỉ redirect", () => {
    for (const s of SHORTCUTS) {
      const page = path.join(APP_DIR, s.href.replace(/^\//, ""), "page.tsx");
      expect(existsSync(page), s.href).toBe(true);
      expect(readFileSync(page, "utf8"), s.href).not.toMatch(/^\s*redirect\(/m);
    }
  });
});
