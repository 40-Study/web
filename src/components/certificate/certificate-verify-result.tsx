import Link from "next/link";
import type { VerifyCertificateResponse } from "@/services/certificate.service";
import { CertificateView } from "./certificate-view";

/**
 * Kết quả tra cứu chứng chỉ — TRANG CÔNG KHAI, ai cũng xem được.
 *
 * Chỉ hiển thị đúng các trường backend trả trong VerifyCertificateResponseDTO
 * (valid, certificate_number, user_name, course_name, issued_at).
 * KHÔNG gọi thêm endpoint cần đăng nhập, KHÔNG hiện user_id/enrollment_id —
 * đây là trang public, mọi thứ hiện ra là công khai với cả internet.
 */
export function CertificateVerifyResult({
  result,
  certificateNumber,
  verifyUrl,
}: {
  result: VerifyCertificateResponse | null;
  certificateNumber: string;
  verifyUrl?: string;
}) {
  const isValid = result?.valid === true;

  if (!isValid) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h1 className="text-lg font-semibold text-red-800">
          Không tìm thấy chứng chỉ
        </h1>
        <p className="mt-2 text-sm text-red-700">
          Mã{" "}
          <span className="font-mono font-medium">{certificateNumber}</span>{" "}
          không hợp lệ hoặc không tồn tại trong hệ thống.
        </p>
        <Link
          href="/certificates/verify"
          className="mt-4 inline-block rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Tra cứu mã khác
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-xl rounded-xl border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-sm font-semibold text-green-800">
          ✓ Chứng chỉ hợp lệ
        </p>
        <p className="mt-1 text-xs text-green-700">
          Được cấp bởi ForteX và đã xác minh trong hệ thống.
        </p>
      </div>

      <CertificateView
        userName={result.user_name ?? "—"}
        courseName={result.course_name ?? "—"}
        certificateNumber={result.certificate_number}
        issuedAt={result.issued_at}
        verifyUrl={verifyUrl}
      />
    </div>
  );
}
