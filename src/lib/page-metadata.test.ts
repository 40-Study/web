import { describe, expect, it } from "vitest";
import { buildPageMetadata, plainTextExcerpt } from "./page-metadata";

describe("buildPageMetadata", () => {
  const meta = buildPageMetadata({ title: "Khóa học", description: "Mô tả khóa học", path: "/courses" });

  it("đặt title/description cho thẻ <title> và meta description", () => {
    expect(meta.title).toBe("Khóa học");
    expect(meta.description).toBe("Mô tả khóa học");
  });

  it("og:title/description/url riêng của trang (không rơi về mặc định toàn site)", () => {
    expect(meta.openGraph).toMatchObject({
      title: "Khóa học",
      description: "Mô tả khóa học",
      url: "http://localhost:3000/courses",
      type: "website",
    });
  });

  it("giữ lại og:image/siteName/locale của site vì openGraph ở trang con THAY HẲN openGraph của root", () => {
    expect(meta.openGraph).toMatchObject({ siteName: "ForteX", locale: "vi_VN" });
    expect((meta.openGraph as { images?: unknown[] }).images?.length).toBeGreaterThan(0);
  });

  it("canonical theo path của trang", () => {
    expect(meta.alternates?.canonical).toBe("/courses");
  });

  it("twitter card khớp title/description", () => {
    expect(meta.twitter).toMatchObject({ title: "Khóa học", description: "Mô tả khóa học" });
  });

  it("cho ghi đè type và ảnh (vd bài viết có ảnh riêng)", () => {
    const article = buildPageMetadata({
      title: "Bài",
      description: "d",
      path: "/discussions/x",
      type: "article",
      images: [{ url: "https://cdn.test/a.png" }],
    });
    expect(article.openGraph).toMatchObject({ type: "article", images: [{ url: "https://cdn.test/a.png" }] });
  });
});

describe("plainTextExcerpt", () => {
  it("bỏ thẻ HTML, gộp khoảng trắng", () => {
    expect(plainTextExcerpt("<p>Xin  <b>chào</b></p>\n<p>các bạn</p>")).toBe("Xin chào các bạn");
  });

  it("cắt theo độ dài tối đa, thêm dấu … và không cắt giữa từ khi có thể", () => {
    const text = "một hai ba bốn năm sáu bảy tám chín mười";
    const out = plainTextExcerpt(text, 20);
    expect(out.length).toBeLessThanOrEqual(21);
    expect(out.endsWith("…")).toBe(true);
    expect(text.startsWith(out.slice(0, -1).trimEnd())).toBe(true);
  });

  it("giải mã entity thường gặp để Next không escape lần hai trong <meta>", () => {
    expect(plainTextExcerpt("<p>Tom &amp; Jerry &quot;vui&quot; &lt;3 &gt; 2 &#39;ok&#39;&nbsp;nhé</p>")).toBe(
      "Tom & Jerry \"vui\" <3 > 2 'ok' nhé"
    );
  });

  it("giải mã entity số (thập phân và hex)", () => {
    expect(plainTextExcerpt("caf&#233; &#x1F600; &#xe9;")).toBe("café 😀 é");
  });

  it("chỉ giải mã một lượt: &amp;lt; ra &lt; chứ không thành <", () => {
    expect(plainTextExcerpt("&amp;lt;b&amp;gt;")).toBe("&lt;b&gt;");
  });

  it("&lt;b&gt; là chữ của bài viết, không bị coi là thẻ để xoá", () => {
    expect(plainTextExcerpt("dùng thẻ &lt;b&gt; để in đậm")).toBe("dùng thẻ <b> để in đậm");
  });

  it("entity lạ hoặc số ngoài dải Unicode giữ nguyên", () => {
    expect(plainTextExcerpt("a &foo; b &#99999999; c &#0;")).toBe("a &foo; b &#99999999; c &#0;");
  });

  it("văn bản ngắn giữ nguyên, rỗng trả chuỗi rỗng", () => {
    expect(plainTextExcerpt("ngắn")).toBe("ngắn");
    expect(plainTextExcerpt("")).toBe("");
  });
});
