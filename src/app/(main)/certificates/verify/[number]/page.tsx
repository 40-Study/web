import type { Metadata } from "next";
import { CertificateVerifyResult } from "@/components/certificate/certificate-verify-result";
import { verifyCertificateServer } from "@/lib/server-fetchers/certificate";

/**
 * Tra cứu chứng chỉ — TRANG CÔNG KHAI (không cần đăng nhập).
 *
 * Là server component để có metadata động: link chứng chỉ thường được chia sẻ
 * lên LinkedIn/Facebook, cần OpenGraph đúng tên người học + khóa học.
 * Nằm trong group (main) — group này không có RoleGuard (khác với (app)).
 */

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function generateMetadata({
  params,
}: {
  params: { number: string };
}): Promise<Metadata> {
  const result = await verifyCertificateServer(params.number);

  if (!result?.valid) {
    return {
      title: "Không tìm thấy chứng chỉ",
      robots: { index: false, follow: false },
    };
  }

  const title = `Chứng chỉ ${result.course_name ?? ""} — ${result.user_name ?? ""}`.trim();
  const description = `Chứng chỉ hoàn thành khóa học${
    result.course_name ? ` "${result.course_name}"` : ""
  } do ForteX cấp. Mã: ${result.certificate_number}.`;
  const url = `${siteUrl()}/certificates/verify/${encodeURIComponent(params.number)}`;

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
  const result = await verifyCertificateServer(params.number);
  const verifyUrl = `${siteUrl()}/certificates/verify/${encodeURIComponent(params.number)}`;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <CertificateVerifyResult
        result={result}
        certificateNumber={params.number}
        verifyUrl={verifyUrl}
      />
    </div>
  );
}
