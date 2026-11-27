import type { Metadata } from "next";
import { CertificateVerifyResult } from "@/components/certificate/certificate-verify-result";
import { verifyCertificateServer } from "@/lib/server-fetchers/certificate";
import { SITE_URL } from "@/lib/seo";
import { normalizeCertificateNumber } from "@/lib/certificate-number";

/**
 * Tra cứu chứng chỉ — TRANG CÔNG KHAI (không cần đăng nhập).
 *
 * Là server component để có metadata động: link chứng chỉ thường được chia sẻ
 * lên LinkedIn/Facebook, cần OpenGraph đúng tên người học + khoá học.
 * Nằm trong group (main) — group này không có RoleGuard (khác với (app)).
 */

/**
 * Số chứng chỉ CHUẨN để dựng URL xác minh (Q7-PG-06): mã nhập vào đã được backend chuẩn hoá (hoa/thường, khoảng trắng),
 * nên "Xác minh tại" / canonical / og:url phải dùng số backend trả về, không lặp lại đúng thứ khách gõ trên thanh địa chỉ.
 * Không xác minh được (không có kết quả) thì giữ số trên URL.
 */
function canonicalVerifyUrl(result: { certificate_number?: string } | null, typed: string): string {
  return `${SITE_URL}/certificates/verify/${encodeURIComponent(result?.certificate_number || typed)}`;
}

export async function generateMetadata({
  params,
}: {
  params: { number: string };
}): Promise<Metadata> {
  const result = await verifyCertificateServer(normalizeCertificateNumber(params.number));

  if (result?.revoked) {
    return {
      title: "Chứng chỉ đã bị thu hồi",
      robots: { index: false, follow: false },
    };
  }

  if (!result?.valid) {
    return {
      title: "Không tìm thấy chứng chỉ",
      robots: { index: false, follow: false },
    };
  }

  const title = `Chứng chỉ ${result.course_name ?? ""} — ${result.user_name ?? ""}`.trim();
  const description = `Chứng chỉ hoàn thành khoá học${
    result.course_name ? ` "${result.course_name}"` : ""
  } do ForteX cấp. Mã: ${result.certificate_number}.`;
  const url = canonicalVerifyUrl(result, normalizeCertificateNumber(params.number));

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary", title, description },
    // Trang chứa dữ liệu cá nhân của một người học -> không cho index
    robots: { index: false, follow: true },
  };
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: { number: string };
}) {
  // Q9-PG-09: mã trên URL có thể kèm khoảng trắng (%20) hoặc còn percent-encoded; chuẩn hoá một lần cho cả fetch lẫn URL.
  const typed = normalizeCertificateNumber(params.number);
  const result = await verifyCertificateServer(typed);
  const verifyUrl = canonicalVerifyUrl(result, typed);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <CertificateVerifyResult
        result={result}
        certificateNumber={typed}
        verifyUrl={verifyUrl}
      />
    </div>
  );
}
