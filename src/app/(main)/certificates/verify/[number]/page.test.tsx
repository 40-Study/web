import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyMock = vi.fn();
vi.mock("@/lib/server-fetchers/certificate", () => ({ verifyCertificateServer: (n: string) => verifyMock(n) }));
vi.mock("@/components/certificate/certificate-verify-result", () => ({ CertificateVerifyResult: () => null }));
vi.mock("@/lib/seo", () => ({ SITE_URL: "https://forte.test" }));

import { generateMetadata } from "./page";

const meta = (number = "C-1") => generateMetadata({ params: { number } });

describe("generateMetadata của trang verify chứng chỉ", () => {
  beforeEach(() => verifyMock.mockReset());

  it("chứng chỉ đã thu hồi: tiêu đề 'Chứng chỉ đã bị thu hồi', không index, không lộ tên", async () => {
    verifyMock.mockResolvedValue({ valid: false, revoked: true, certificate_number: "C-1" });
    const m = await meta();
    expect(m.title).toBe("Chứng chỉ đã bị thu hồi");
    expect(m.robots).toEqual({ index: false, follow: false });
  });

  it("không tìm thấy: giữ tiêu đề cũ", async () => {
    verifyMock.mockResolvedValue(null);
    expect((await meta()).title).toBe("Không tìm thấy chứng chỉ");
  });

  it("hợp lệ: tiêu đề có tên khoá học và học viên", async () => {
    verifyMock.mockResolvedValue({
      valid: true,
      certificate_number: "C-1",
      course_name: "Khoá A",
      user_name: "Lê Văn C",
    });
    expect((await meta()).title).toContain("Khoá A");
  });
});