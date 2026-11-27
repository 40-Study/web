import { describe, expect, it } from "vitest";
import { cleanCertificateNumber, normalizeCertificateNumber } from "./certificate-number";

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

describe("ký tự vô hình (Q10-PG-05)", () => {
  const CODE = "FORTEX-748c42ba-2dfeb3";

  it.each([
    ["zero-width space U+200B", "\u200B"],
    ["zero-width non-joiner U+200C", "\u200C"],
    ["zero-width joiner U+200D", "\u200D"],
    ["word joiner U+2060", "\u2060"],
    ["BOM U+FEFF", "\uFEFF"],
    ["left-to-right mark U+200E", "\u200E"],
    ["right-to-left mark U+200F", "\u200F"],
    ["soft hyphen U+00AD", "\u00AD"],
    ["bidi isolate U+2066", "\u2066"],
    ["NBSP U+00A0", "\u00A0"],
  ])("%s ở cuối/đầu/giữa bị bỏ", (_name, ch) => {
    expect(normalizeCertificateNumber(`${CODE}${ch}`)).toBe(CODE);
    expect(normalizeCertificateNumber(`${ch}${CODE}`)).toBe(CODE);
    expect(normalizeCertificateNumber(`FORTEX-${ch}748c42ba-2dfeb3`)).toBe(CODE);
    expect(cleanCertificateNumber(`  ${CODE}${ch} `)).toBe(CODE);
  });

  it("dạng percent-encoded của U+200B (%E2%80%8B) từ URL cũng bị bỏ", () => {
    expect(normalizeCertificateNumber(`${CODE}%E2%80%8B`)).toBe(CODE);
  });

  it("chỉ toàn ký tự vô hình -> rỗng (form không gửi)", () => {
    expect(cleanCertificateNumber("\u200B \uFEFF")).toBe("");
  });
});

describe("khớp backend: bỏ mọi ký tự Cf + NBSP, không đụng ký tự thường (#148 L6)", () => {
  it("giữ nguyên chữ, số, dấu gạch và chữ thường/hoa", () => {
    expect(cleanCertificateNumber("Fortex-abc_123.XYZ")).toBe("Fortex-abc_123.XYZ");
  });

  it("nhiều ký tự vô hình hỗn hợp trong cùng một mã", () => {
    expect(cleanCertificateNumber("\u200EFORTEX\u00AD-748c\u200F42ba\u2060-2dfeb3\u00A0")).toBe("FORTEX-748c42ba-2dfeb3");
  });
});
