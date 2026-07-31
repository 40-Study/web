/**
 * Trang tra cứu là CÔNG KHAI — test khoá 2 điều:
 * 1. Mã hợp lệ -> hiện đúng thông tin backend trả.
 * 2. Mã sai / backend lỗi -> KHÔNG lộ dữ liệu nào.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { VerifyCertificateResponse } from "@/services/certificate.service";
import { CertificateVerifyResult } from "../certificate-verify-result";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const VALID: VerifyCertificateResponse = {
  valid: true,
  certificate_number: "CERT-2026-0001",
  user_name: "Nguyễn Văn A",
  course_name: "Lập trình Go",
  issued_at: "2026-07-30T00:00:00Z",
};

describe("chứng chỉ hợp lệ", () => {
  it("hiện tên người học, khóa học và mã", () => {
    render(
      <CertificateVerifyResult
        result={VALID}
        certificateNumber="CERT-2026-0001"
      />
    );

    expect(screen.getByText("Nguyễn Văn A")).toBeDefined();
    expect(screen.getByText("Lập trình Go")).toBeDefined();
    expect(screen.getByText("CERT-2026-0001")).toBeDefined();
    expect(screen.getByText(/Chứng chỉ hợp lệ/)).toBeDefined();
  });

  it("hiện link xác minh khi được truyền vào", () => {
    render(
      <CertificateVerifyResult
        result={VALID}
        certificateNumber="CERT-2026-0001"
        verifyUrl="https://example.com/certificates/verify/CERT-2026-0001"
      />
    );

    expect(
      screen.getByText(/example\.com\/certificates\/verify/)
    ).toBeDefined();
  });
});

describe("chứng chỉ không hợp lệ — không được lộ dữ liệu", () => {
  it("valid=false -> báo không tìm thấy, không hiện tên ai", () => {
    render(
      <CertificateVerifyResult
        result={{ valid: false, certificate_number: "SAI" }}
        certificateNumber="SAI"
      />
    );

    expect(screen.getByText(/Không tìm thấy chứng chỉ/)).toBeDefined();
    expect(screen.queryByText("Nguyễn Văn A")).toBeNull();
    expect(screen.queryByText(/Chứng chỉ hợp lệ/)).toBeNull();
  });

  it("result=null (backend lỗi/404) -> vẫn báo không tìm thấy, không vỡ trang", () => {
    render(
      <CertificateVerifyResult result={null} certificateNumber="BAT-KY" />
    );

    expect(screen.getByText(/Không tìm thấy chứng chỉ/)).toBeDefined();
    expect(screen.getByText("BAT-KY")).toBeDefined();
  });

  it("valid=true nhưng thiếu tên -> render '—', không crash", () => {
    render(
      <CertificateVerifyResult
        result={{ valid: true, certificate_number: "CERT-X" }}
        certificateNumber="CERT-X"
      />
    );

    expect(screen.getByText(/Chứng chỉ hợp lệ/)).toBeDefined();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
