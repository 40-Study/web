import { describe, expect, it } from "vitest";
import { sanitizeArticleHtml, sanitizeHtml } from "./sanitize-html";

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

/**
 * QA 261009 M1 — `article_body` do giáo viên nhập hiện cho MỌI học viên của khoá; allowlist chung
 * (class, data-*, input, img từ xa) đủ để dựng overlay lừa đăng nhập hoặc theo dõi IP. Profile bài viết
 * chặt hơn, và KHÔNG đổi hành vi của `sanitizeHtml` cho các nơi khác (thảo luận, ghi chú).
 */
describe("sanitizeArticleHtml (M1)", () => {
    const overlay = `<a href="https://evil.example" class="fixed inset-0 z-50 bg-white">Phiên đăng nhập hết hạn</a>`;

    it("bỏ class, style, id, data-* — overlay Tailwind không còn ăn được", () => {
        const clean = sanitizeArticleHtml(
            `${overlay}<p class="x" style="position:fixed" id="a" data-type="mention" data-id="1">chữ</p>`
        );
        expect(clean).not.toMatch(/\sclass=/i);
        expect(clean).not.toMatch(/\sstyle=/i);
        expect(clean).not.toMatch(/\sid=/i);
        expect(clean).not.toMatch(/data-/i);
        expect(clean).toContain("Phiên đăng nhập hết hạn");
        expect(clean).toContain("chữ");
    });

    it("bỏ input/label/form/button, giữ chữ bên trong", () => {
        const clean = sanitizeArticleHtml(
            `<form action="https://evil.example"><label>Mật khẩu <input type="password" name="p"></label><button>Gửi</button></form>`
        );
        expect(clean).not.toMatch(/<(form|input|label|button)/i);
        expect(clean).not.toMatch(/\stype=/i);
        expect(clean).toContain("Mật khẩu");
    });

    it("ảnh: ngoài raster base64 chỉ http(s) — data: khác, ftp:, //host, tương đối bị loại; https và http còn", () => {
        const clean = sanitizeArticleHtml(
            [
                `<img src="https://cdn.example/a.png" alt="ok1">`,
                `<img src="http://cdn.example/b.png" alt="ok2">`,
                `<img src="data:image/svg+xml;base64,AAAA" alt="bad-data">`,
                `<img src="ftp://cdn.example/c.png" alt="bad-ftp">`,
                `<img src="//cdn.example/d.png" alt="bad-proto-relative">`,
                `<img src="/relative/e.png" alt="bad-relative">`,
                `<img alt="bad-nosrc">`,
            ].join("")
        );
        expect(clean).toContain('alt="ok1"');
        expect(clean).toContain('alt="ok2"');
        expect(clean).not.toContain("bad-data");
        expect(clean).not.toContain("bad-ftp");
        expect(clean).not.toContain("bad-proto-relative");
        expect(clean).not.toContain("bad-relative");
        expect(clean).not.toContain("bad-nosrc");
        expect(clean).not.toContain("data:");
    });

    it("ảnh data: chỉ raster base64 (png/jpeg/jpg/gif/webp) — svg+xml và kiểu data: khác bị loại", () => {
        const clean = sanitizeArticleHtml(
            [
                `<img src="data:image/png;base64,iVBORw0KGgo=" alt="ok-png">`,
                `<img src="data:image/jpeg;base64,/9j/4AAQ" alt="ok-jpeg">`,
                `<img src="data:image/jpg;base64,/9j/4AAQ" alt="ok-jpg">`,
                `<img src="data:image/gif;base64,R0lGODlh" alt="ok-gif">`,
                `<img src="data:image/webp;base64,UklGRg==" alt="ok-webp">`,
                `<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" alt="bad-svg">`,
                `<img src="data:image/svg+xml,%3Csvg%3E%3C/svg%3E" alt="bad-svg-plain">`,
                `<img src="data:text/html;base64,PHNjcmlwdD4=" alt="bad-html">`,
                `<img src="data:image/png,notbase64" alt="bad-nonbase64">`,
                `<img src="data:image/pngx;base64,AAAA" alt="bad-prefix">`,
                `<img src="data:image/png;base64,AAAA&quot;onerror=1" alt="bad-chars">`,
            ].join("")
        );
        for (const ok of ["ok-png", "ok-jpeg", "ok-jpg", "ok-gif", "ok-webp"]) {
            expect(clean).toContain(`alt="${ok}"`);
        }
        for (const bad of ["bad-svg", "bad-svg-plain", "bad-html", "bad-nonbase64", "bad-prefix", "bad-chars"]) {
            expect(clean).not.toContain(bad);
        }
        expect(clean).not.toContain("svg");
    });

    it("class: giữ khi MỌI token là hljs*/language-* (tô màu code), bỏ cả thuộc tính nếu có token lạ", () => {
        const clean = sanitizeArticleHtml(
            [
                `<pre><code class="language-ts hljs">a</code></pre>`,
                `<span class="hljs-keyword">b</span>`,
                `<span class="hljs-title class_">c</span>`,
                `<span class="hljs fixed inset-0">d</span>`,
                `<span class="hljs-x_y bg-white">e</span>`,
                `<span class="language-">f</span>`,
                `<span class="hljsx">g</span>`,
                `<span class="">h</span>`,
            ].join("")
        );
        const doc = new DOMParser().parseFromString(clean, "text/html");
        const classes = Array.from(doc.querySelectorAll("pre > code, span")).map((n) => n.getAttribute("class"));
        expect(classes).toEqual(["language-ts hljs", "hljs-keyword", "hljs-title class_", null, null, null, null, null]);
    });

    it("mọi liên kết có rel='noopener noreferrer nofollow', kể cả khi người nhập đặt rel khác hay không đặt", () => {
        const clean = sanitizeArticleHtml(
            `<a href="https://a.example" target="_blank" rel="opener">a</a><a href="https://b.example">b</a>`
        );
        const doc = new DOMParser().parseFromString(clean, "text/html");
        const anchors = Array.from(doc.querySelectorAll("a"));
        expect(anchors).toHaveLength(2);
        for (const a of anchors) {
            expect(a.getAttribute("rel")?.split(/\s+/).sort()).toEqual(["nofollow", "noopener", "noreferrer"]);
        }
        expect(anchors[0].getAttribute("target")).toBe("_blank");
        expect(anchors[1].hasAttribute("target")).toBe(false);
    });

    it("target khác _blank bị bỏ (không đổi được top-level browsing context)", () => {
        const clean = sanitizeArticleHtml(`<a href="https://a.example" target="_top">a</a>`);
        expect(clean).not.toContain("target=");
    });

    it("vẫn giữ định dạng Tiptap: tiêu đề, danh sách, bảng, code, link https", () => {
        const clean = sanitizeArticleHtml(
            `<h2>Mục</h2><ul><li>a</li></ul><table><tbody><tr><td colspan="2">x</td></tr></tbody></table><pre><code>1</code></pre><a href="https://ok.example">l</a>`
        );
        for (const frag of ["<h2>Mục</h2>", "<li>a</li>", "<table>", 'colspan="2"', "<pre><code>1</code></pre>", 'href="https://ok.example"']) {
            expect(clean).toContain(frag);
        }
    });

    it("vẫn loại script/onerror/javascript:", () => {
        const clean = sanitizeArticleHtml(`<p>a</p><script>1</script><img src="https://x.example/a.png" onerror="1"><a href="javascript:1">j</a>`);
        expect(clean).not.toMatch(/<script|onerror|javascript:/i);
    });

    it("hook ảnh/liên kết KHÔNG rò sang sanitizeHtml chung (nơi khác giữ nguyên hành vi)", () => {
        sanitizeArticleHtml(`<img src="https://x.example/a.png"><a href="https://a.example">a</a>`);
        const general = sanitizeHtml(`<img src="data:image/png;base64,AAAA" alt="keep"><a href="https://a.example" class="k">a</a>`);
        expect(general).toContain("data:image/png");
        expect(general).toContain('class="k"');
        expect(general).not.toContain("nofollow");
    });

    it("null/undefined/rỗng -> chuỗi rỗng", () => {
        expect(sanitizeArticleHtml(null)).toBe("");
        expect(sanitizeArticleHtml(undefined)).toBe("");
        expect(sanitizeArticleHtml("")).toBe("");
    });
});
