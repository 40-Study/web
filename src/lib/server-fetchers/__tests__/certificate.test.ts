import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../base-url", () => ({ getPublicApiBaseUrl: () => "http://api.test/api" }));

import { verifyCertificateServer } from "../certificate";

describe("verifyCertificateServer", () => {
  afterEach(() => vi.unstubAllGlobals());

  // Chứng chỉ đã thu hồi không được hiện "hợp lệ" kèm tên học viên từ data cache của Next.js.
  it("không cache: gửi cache no-store và không đặt revalidate", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { valid: false, revoked: true, certificate_number: "C-1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyCertificateServer("C-1");

    expect(result?.revoked).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://api.test/api/certificates/verify/C-1");
    expect(init?.cache).toBe("no-store");
    expect(init?.next?.revalidate).toBeUndefined();
  });

  it("backend lỗi thì trả null, không ném", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    await expect(verifyCertificateServer("C-2")).resolves.toBeNull();
  });

  // L1 (#142 review): trang giải mã đúng một lần; fetcher chỉ mã hoá lại, không giải mã/cắt thêm.
  it("mã chứa '%' đã giải mã được mã hoá lại đúng một lần, không giải mã hai lần", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { valid: true, certificate_number: "A%41" } }) });
    vi.stubGlobal("fetch", fetchMock);

    await verifyCertificateServer("A%41");

    expect(String(fetchMock.mock.calls[0][0])).toBe("http://api.test/api/certificates/verify/A%2541");
  });
});
