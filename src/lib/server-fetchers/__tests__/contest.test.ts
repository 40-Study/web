import { afterEach, describe, expect, it, vi } from "vitest";
import { getContestBySlugServer } from "../contest";

afterEach(() => vi.unstubAllGlobals());

function stubFetch(impl: (...args: unknown[]) => Promise<Partial<Response>>) {
  const fn = vi.fn(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("getContestBySlugServer (G-09)", () => {
  it("200: trả tên cuộc thi, gọi đúng endpoint với slug đã mã hoá", async () => {
    const fn = stubFetch(async () => ({ ok: true, status: 200, json: async () => ({ data: { title: "React Hooks Challenge", id: "x" } }) }));
    expect(await getContestBySlugServer("a/b")).toEqual({ title: "React Hooks Challenge" });
    expect(String(fn.mock.calls[0][0])).toMatch(/\/contests\/a%2Fb$/);
  });

  it("404, 5xx hoặc lỗi mạng: null (layout dùng tiêu đề chung)", async () => {
    stubFetch(async () => ({ ok: false, status: 404 }));
    expect(await getContestBySlugServer("zzz")).toBeNull();
    stubFetch(async () => ({ ok: false, status: 500 }));
    expect(await getContestBySlugServer("zzz")).toBeNull();
    stubFetch(async () => {
      throw new Error("ECONNREFUSED");
    });
    expect(await getContestBySlugServer("zzz")).toBeNull();
  });

  it("200 nhưng thiếu title: null", async () => {
    stubFetch(async () => ({ ok: true, status: 200, json: async () => ({ data: {} }) }));
    expect(await getContestBySlugServer("x")).toBeNull();
  });
});
