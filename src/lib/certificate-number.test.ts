import { describe, expect, it } from "vitest";
import { normalizeCertificateNumber } from "./certificate-number";

describe("normalizeCertificateNumber (Q9-PG-09)", () => {
  it("cắt khoảng trắng đầu/cuối, kể cả dạng percent-encoded từ params của Next", () => {
    expect(normalizeCertificateNumber("CERT-1%20")).toBe("CERT-1");
    expect(normalizeCertificateNumber("%20CERT-1")).toBe("CERT-1");
    expect(normalizeCertificateNumber(" CERT-1 ")).toBe("CERT-1");
  });

  it("mã sạch giữ nguyên", () => {
    expect(normalizeCertificateNumber("FORTEX-748c42ba-2dfeb3")).toBe("FORTEX-748c42ba-2dfeb3");
  });

  it("'%' lẻ (không phải percent-encoding) không làm vỡ trang", () => {
    expect(normalizeCertificateNumber("ABC%ZZ ")).toBe("ABC%ZZ");
  });
});
