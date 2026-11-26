/**
 * L2 (QA7 S7-07): ngày cấp chứng chỉ từng tự dựng bằng toLocaleDateString("vi-VN", month: "long") theo múi giờ
 * trình duyệt. Giờ dùng định dạng chung dd/MM/yyyy theo giờ Việt Nam.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CertificateView } from "../certificate-view";

const props = { userName: "Nguyễn Văn A", courseName: "Lập trình Go", certificateNumber: "CERT-2026-0001" };

describe("CertificateView — ngày cấp", () => {
  it("dd/MM/yyyy theo giờ Việt Nam (20:30 UTC ngày 25 là ngày 26 ở VN)", () => {
    render(<CertificateView {...props} issuedAt="2026-11-25T20:30:00Z" />);
    expect(screen.getByText("Cấp ngày 26/11/2026")).toBeTruthy();
  });

  it("không có ngày cấp thì không in dòng 'Cấp ngày'", () => {
    render(<CertificateView {...props} />);
    expect(screen.queryByText(/Cấp ngày/)).toBeNull();
  });
});
