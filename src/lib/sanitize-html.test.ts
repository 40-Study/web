import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./sanitize-html";

describe("sanitizeHtml", () => {
    it("loại bỏ thuộc tính onerror trong thẻ img", () => {
        const dirty = `<img src=x onerror=alert(1)>`;
        const clean = sanitizeHtml(dirty);
        expect(clean).not.toContain("onerror");
        expect(clean).not.toContain("alert(1)");
    });

    it("loại bỏ toàn bộ thẻ script và nội dung bên trong", () => {
        const dirty = `<p>hello</p><script>alert(1)</script>`;
        const clean = sanitizeHtml(dirty);
        expect(clean).not.toContain("<script");
        expect(clean).not.toContain("alert(1)");
        expect(clean).toContain("hello");
    });

    it("loại bỏ href dạng javascript: trong thẻ a", () => {
        const dirty = `<a href="javascript:alert(1)">click me</a>`;
        const clean = sanitizeHtml(dirty);
        expect(clean).not.toContain("javascript:");
    });

    it("loại bỏ toàn bộ thẻ iframe", () => {
        const dirty = `<p>text</p><iframe src="https://evil.example"></iframe>`;
        const clean = sanitizeHtml(dirty);
        expect(clean).not.toContain("<iframe");
    });

    it("giữ nguyên định dạng đậm/nghiêng/gạch dưới hợp lệ của tiptap", () => {
        const dirty = `<p><strong>Đậm</strong> và <em>nghiêng</em> và <u>gạch dưới</u></p>`;
        const clean = sanitizeHtml(dirty);
        expect(clean).toContain("<strong>Đậm</strong>");
        expect(clean).toContain("<em>nghiêng</em>");
        expect(clean).toContain("<u>gạch dưới</u>");
    });

    it("giữ nguyên danh sách (ul/li) hợp lệ của tiptap", () => {
        const dirty = `<ul><li>Item 1</li><li>Item 2</li></ul>`;
        const clean = sanitizeHtml(dirty);
        expect(clean).toContain("<li>Item 1</li>");
        expect(clean).toContain("<li>Item 2</li>");
    });

    it("giữ nguyên link http hợp lệ với target/rel do tiptap Link extension gắn", () => {
        const dirty = `<a href="http://example.com" target="_blank" rel="noopener noreferrer">Link</a>`;
        const clean = sanitizeHtml(dirty);
        expect(clean).toContain('href="http://example.com"');
        expect(clean).toContain("Link");
    });

    it("giữ nguyên blockquote, code, pre hợp lệ", () => {
        const dirty = `<blockquote><p>quote</p></blockquote><pre><code>const x = 1;</code></pre>`;
        const clean = sanitizeHtml(dirty);
        expect(clean).toContain("<blockquote>");
        expect(clean).toContain("<pre>");
        expect(clean).toContain("<code>");
    });

    it("trả về chuỗi rỗng cho input null/undefined/rỗng", () => {
        expect(sanitizeHtml(null)).toBe("");
        expect(sanitizeHtml(undefined)).toBe("");
        expect(sanitizeHtml("")).toBe("");
    });

    it("loại bỏ mọi thuộc tính on* khác (onclick, onload...)", () => {
        const dirty = `<p onclick="alert(1)" onload="alert(2)">text</p>`;
        const clean = sanitizeHtml(dirty);
        expect(clean).not.toContain("onclick");
        expect(clean).not.toContain("onload");
    });
});
