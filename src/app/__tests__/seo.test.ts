/**
 * Hàng rào SEO: sitemap chỉ được chứa trang công khai thật sự.
 *
 * Rủi ro cần chặn: ai đó thêm route cần đăng nhập vào sitemap -> Google crawl
 * ra trang rỗng/redirect -> bị đánh soft-404, hại xếp hạng. Hoặc tệ hơn, khai
 * báo URL chứa dữ liệu cá nhân (trang tra cứu theo mã chứng chỉ).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import manifest from "../manifest";
import robots from "../robots";
import sitemap from "../sitemap";
import { DISALLOWED_PATH_PREFIXES, SITE_URL } from "@/lib/seo";

// Không gọi backend thật trong unit test
vi.mock("@/lib/server-fetchers/course", () => ({
  listPublishedCoursesServer: vi.fn(),
}));

import { listPublishedCoursesServer } from "@/lib/server-fetchers/course";

const mockList = vi.mocked(listPublishedCoursesServer);

async function paths() {
  const entries = await sitemap();
  return entries.map((e) => e.url.replace(SITE_URL, "") || "/");
}

beforeEach(() => {
  mockList.mockReset();
  mockList.mockResolvedValue([
    { id: "1", slug: "lap-trinh-go", title: "Lập trình Go" },
    { id: "2", slug: "react-co-ban", title: "React cơ bản" },
  ]);
});

describe("sitemap", () => {
  it("mọi URL đều tuyệt đối, cùng domain", async () => {
    const entries = await sitemap();
    for (const e of entries) {
      expect(e.url.startsWith(SITE_URL)).toBe(true);
    }
  });

  it("KHÔNG chứa route cần đăng nhập", async () => {
    for (const p of await paths()) {
      expect(p).not.toMatch(/^\/(admin|teacher|parent|settings|my-)/);
    }
  });

  it("KHÔNG chứa trang auth", async () => {
    for (const p of await paths()) {
      expect(p).not.toMatch(/^\/(login|register|otp|forgot-password|reset-password)/);
    }
  });

  it("KHÔNG chứa trang tra cứu theo mã — dữ liệu cá nhân", async () => {
    for (const p of await paths()) {
      expect(p).not.toMatch(/^\/certificates\/verify\/.+/);
    }
  });

  it("có các trang public chính", async () => {
    const p = await paths();
    expect(p).toContain("/");
    expect(p).toContain("/courses");
    expect(p).toContain("/certificates/verify");
  });

  it("có trang chi tiết từng khóa học (trang đã được mở công khai)", async () => {
    const p = await paths();
    expect(p).toContain("/courses/lap-trinh-go");
    expect(p).toContain("/courses/react-co-ban");
  });

  it("backend chết -> vẫn build được sitemap với route tĩnh", async () => {
    mockList.mockResolvedValue([]);
    const p = await paths();

    expect(p).toContain("/");
    expect(p).toContain("/courses");
    expect(p.some((x) => x.startsWith("/courses/"))).toBe(false);
  });
});

describe("robots", () => {
  const r = robots();
  const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
  const disallow = (rules?.disallow ?? []) as string[];

  it("trỏ tới sitemap đúng domain", () => {
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("chặn /api/ và khu vực cần đăng nhập", () => {
    expect(disallow).toContain("/api/");
    expect(disallow).toContain("/admin");
    expect(disallow).toContain("/teacher");
  });

  it("chặn trang kết quả tra cứu NHƯNG không chặn form", () => {
    // robots.txt khớp theo tiền tố: "/certificates/verify/" (có / cuối) chặn
    // các trang con nhưng để lọt "/certificates/verify"
    expect(disallow).toContain("/certificates/verify/");
    expect(disallow).not.toContain("/certificates/verify");
  });

  it("mọi mục disallow đều bắt đầu bằng /", () => {
    for (const d of DISALLOWED_PATH_PREFIXES) {
      expect(d.startsWith("/")).toBe(true);
    }
  });
});

describe("manifest", () => {
  const m = manifest();

  it("có đủ trường tối thiểu để cài lên màn hình chính", () => {
    expect(m.name).toBeTruthy();
    expect(m.short_name).toBeTruthy();
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
  });

  it("khai báo cả icon 192 và 512", () => {
    const sizes = (m.icons ?? []).map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });
});
