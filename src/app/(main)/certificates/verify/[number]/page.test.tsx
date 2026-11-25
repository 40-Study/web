import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyMock = vi.fn();
vi.mock("@/lib/server-fetchers/certificate", () => ({ verifyCertificateServer: (n: string) => verifyMock(n) }));
vi.mock("@/components/certificate/certificate-verify-result", () => ({ CertificateVerifyResult: () => null }));
vi.mock("@/lib/seo", () => ({ SITE_URL: "https://forte.test" }));

import VerifyCertificatePage, { generateMetadata } from "./page";

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

// Q7-PG-06: mở bằng mã khác hoa/thường ("forTEX-...") thì "Xác minh tại", canonical, og:url vẫn phải là số chuẩn của backend.
describe("URL xác minh dùng số chứng chỉ chuẩn (Q7-PG-06)", () => {
  beforeEach(() => verifyMock.mockReset());
  const typed = "forTEX-748c42ba-2dfeb3 ";
  const canonical = "FORTEX-748c42ba-2dfeb3";

  it("generateMetadata: canonical và og:url theo số backend trả về", async () => {
    verifyMock.mockResolvedValue({ valid: true, certificate_number: canonical, course_name: "A", user_name: "B" });
    const m = await generateMetadata({ params: { number: typed } });
    const want = `https://forte.test/certificates/verify/${canonical}`;
    expect(m.alternates?.canonical).toBe(want);
    expect(m.openGraph?.url).toBe(want);
  });

  it("trang: verifyUrl truyền xuống component theo số chuẩn", async () => {
    verifyMock.mockResolvedValue({ valid: true, certificate_number: canonical });
    const el = (await VerifyCertificatePage({ params: { number: typed } })) as React.ReactElement<{
      children: React.ReactElement<{ verifyUrl: string }>;
    }>;
    expect(el.props.children.props.verifyUrl).toBe(`https://forte.test/certificates/verify/${canonical}`);
  });

  it("không xác minh được: giữ số trên URL", async () => {
    verifyMock.mockResolvedValue(null);
    const el = (await VerifyCertificatePage({ params: { number: "C-9" } })) as React.ReactElement<{
      children: React.ReactElement<{ verifyUrl: string }>;
    }>;
    expect(el.props.children.props.verifyUrl).toBe("https://forte.test/certificates/verify/C-9");
  });
});
