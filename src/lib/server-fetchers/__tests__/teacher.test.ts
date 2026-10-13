/**
 * Review QA2 #9: `/teachers/<id-không-tồn-tại>` trả HTTP 200 (soft 404 do client `notFound()`). Fetcher phía server
 * cho layout phân biệt "không có giảng viên này" (404/400) với "backend lỗi" (không được biến thành 404).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { getTeacherPublicProfileServer } from "../teacher";

afterEach(() => vi.unstubAllGlobals());

function stubFetch(impl: (...args: unknown[]) => Promise<Partial<Response>>) {
  const fn = vi.fn(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("getTeacherPublicProfileServer", () => {
  it("200: trả hồ sơ", async () => {
    const fn = stubFetch(async () => ({ ok: true, status: 200, json: async () => ({ data: { id: "t1", user_name: "gv" } }) }));
    expect(await getTeacherPublicProfileServer("t1")).toEqual({ status: "ok", profile: { id: "t1", user_name: "gv" } });
    expect(String(fn.mock.calls[0][0])).toMatch(/\/teachers\/t1\/public-profile$/);
  });

  it.each([404, 400])("%i: không có giảng viên này -> not-found", async (code) => {
    stubFetch(async () => ({ ok: false, status: code }));
    expect(await getTeacherPublicProfileServer("zzz")).toEqual({ status: "not-found" });
  });

  it("500 hoặc lỗi mạng: unavailable, KHÔNG phải not-found", async () => {
    stubFetch(async () => ({ ok: false, status: 500 }));
    expect(await getTeacherPublicProfileServer("t1")).toEqual({ status: "unavailable" });
    stubFetch(async () => {
      throw new Error("ECONNREFUSED");
    });
    expect(await getTeacherPublicProfileServer("t1")).toEqual({ status: "unavailable" });
  });

  it("id được mã hoá trong URL (không chèn được đường dẫn)", async () => {
    const fn = stubFetch(async () => ({ ok: false, status: 404 }));
    await getTeacherPublicProfileServer("../admin");
    expect(String(fn.mock.calls[0][0])).toContain(`/teachers/${encodeURIComponent("../admin")}/public-profile`);
  });
});
