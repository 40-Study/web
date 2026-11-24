/** N-03 (QA4 261123): link chia sẻ cuộc thi từng mang og:title "ForteX — Learn Leap Lead" và mô tả của trang danh sách. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetcher = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/server-fetchers/contest", () => ({ getContestBySlugServer: fetcher.get }));

import { generateMetadata } from "./layout";

beforeEach(() => {
  fetcher.get.mockReset();
});

describe("/contests/[slug] generateMetadata", () => {
  it("có cuộc thi -> og:title, mô tả và ảnh của cuộc thi; giữ template cho trang con", async () => {
    fetcher.get.mockResolvedValue({ title: "Thi React Hooks", description: "<p>Thử sức <b>hooks</b></p>", banner_url: "https://cdn/b.png" });
    const meta = await generateMetadata({ params: { slug: "demo-thi-react-hooks" } });
    expect(meta.title).toEqual({ default: "Thi React Hooks", template: "%s | ForteX" });
    expect(meta.description).toBe("Thử sức hooks");
    expect(meta.openGraph?.title).toBe("Thi React Hooks");
    expect(meta.openGraph?.description).toBe("Thử sức hooks");
    expect(meta.openGraph?.images).toEqual([{ url: "https://cdn/b.png", alt: "Thi React Hooks" }]);
    expect(meta.alternates?.canonical).toBe("/contests/demo-thi-react-hooks");
  });

  it("không có mô tả -> câu mô tả theo tên cuộc thi", async () => {
    fetcher.get.mockResolvedValue({ title: "Thi A", description: null, banner_url: null });
    const meta = await generateMetadata({ params: { slug: "a" } });
    expect(meta.description).toContain("Thi A");
  });

  it("không lấy được cuộc thi -> {} (giữ metadata chung)", async () => {
    fetcher.get.mockResolvedValue(null);
    expect(await generateMetadata({ params: { slug: "x" } })).toEqual({});
  });
});
