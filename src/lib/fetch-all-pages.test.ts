import { describe, expect, it, vi } from "vitest";
import { fetchAllPages } from "./fetch-all-pages";

describe("fetchAllPages (QA3 Q2: /courses chỉ thấy 20/52 khoá)", () => {
  it("gom đủ 52 dòng qua 3 trang page_size 20", async () => {
    const all = Array.from({ length: 52 }, (_, i) => i);
    const fetchPage = vi.fn(async (page: number, size: number) => ({
      items: all.slice((page - 1) * size, page * size),
      total: all.length,
    }));
    const result = await fetchAllPages(fetchPage, 20);
    expect(result.items).toEqual(all);
    expect(result.total).toBe(52);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it("một trang đủ thì chỉ gọi một lần", async () => {
    const fetchPage = vi.fn(async () => ({ items: [1, 2], total: 2 }));
    await fetchAllPages(fetchPage);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("trang rỗng dừng vòng lặp dù total lớn hơn", async () => {
    const fetchPage = vi.fn(async (page: number) => ({ items: page === 1 ? [1] : [], total: 9 }));
    const result = await fetchAllPages(fetchPage);
    expect(result.items).toEqual([1]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("total sai không bao giờ chạm đủ thì ném lỗi, không treo", async () => {
    const fetchPage = vi.fn(async () => ({ items: [1], total: 1_000_000 }));
    await expect(fetchAllPages(fetchPage)).rejects.toThrow(/vượt/);
  });
});
