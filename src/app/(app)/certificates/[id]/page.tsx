"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  CertificatePrintButton,
  CertificateView,
} from "@/components/certificate/certificate-view";
import { useCertificate } from "@/hooks/queries/use-certificates";

export default function CertificateDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { data: certificate, isLoading, isError } = useCertificate(id);
  const [copied, setCopied] = useState(false);

  const verifyUrl = certificate
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/certificates/verify/${encodeURIComponent(certificate.certificate_number)}`
    : "";

  async function copyVerifyLink() {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      toast.success("Đã sao chép link xác minh");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không sao chép được. Hãy copy thủ công từ tấm chứng chỉ.");
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center text-sm text-gray-500">
        Đang tải…
      </div>
    );
  }

  if (isError || !certificate) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8 text-center">
        <p className="text-sm text-gray-600">
          Không tìm thấy chứng chỉ này hoặc bạn không có quyền xem.
        </p>
        <Link
          href="/certificates"
          className="mt-4 inline-block rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Về danh sách chứng chỉ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/certificates"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Chứng chỉ của tôi
        </Link>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyVerifyLink}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {copied ? "Đã sao chép" : "Copy link xác minh"}
          </button>
          <CertificatePrintButton />
        </div>
      </div>

      <CertificateView
        userName={certificate.user_name}
        courseName={certificate.course_name}
        certificateNumber={certificate.certificate_number}
        issuedAt={certificate.issued_at}
        verifyUrl={verifyUrl}
      />

      {/* certificate_url hiện luôn null (backend chưa có worker sinh PDF);
          nếu sau này có thì ưu tiên bản chính thức từ server. */}
      {certificate.certificate_url && (
        <p className="no-print mt-4 text-center text-sm">
          <a
            href={certificate.certificate_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline"
          >
            Tải bản PDF chính thức
          </a>
        </p>
      )}
    </div>
  );
}
