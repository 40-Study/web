"use client";

/**
 * Chứng nhận cuộc thi in được (#17 `GET /contests/:id/certificate`, chỉ của chính mình). Nút In
 * dùng `window.print()`; khi in, CSS `print:` ẩn mọi thứ trừ khung chứng nhận.
 */
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Award, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContestCertificate, useContestDetail } from "@/hooks/queries/use-contests";
import { siteConfig } from "@/lib/constants";
import { contestPath } from "@/lib/contest/contest-cta";
import { contestErrorCode } from "@/lib/contest/contest-errors";
import { formatContestDateTime } from "@/lib/contest/contest-format";
import { ContestErrorState, ContestLoading } from "../../_components/contest-states";

export default function ContestCertificatePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const detailQuery = useContestDetail(slug);
  const certQuery = useContestCertificate(detailQuery.data?.id);

  if (detailQuery.isLoading || (detailQuery.data && certQuery.isLoading)) return <ContestLoading label="Đang tải chứng nhận…" />;
  const error = detailQuery.error ?? certQuery.error;
  if (error || !certQuery.data) {
    const none = contestErrorCode(error) === "CONTEST_CERTIFICATE_NOT_FOUND";
    return (
      <div className="px-4 py-10">
        <ContestErrorState
          error={error}
          title={none ? "Không có chứng nhận" : "Không tải được chứng nhận"}
          onRetry={none ? undefined : () => (detailQuery.error ? detailQuery.refetch() : certQuery.refetch())}
          backHref={detailQuery.data ? contestPath(slug) : "/contests"}
          backLabel={detailQuery.data ? "Về trang cuộc thi" : "Về danh sách cuộc thi"}
        />
      </div>
    );
  }

  const cert = certQuery.data;
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 sm:px-6 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={contestPath(slug)} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Về trang cuộc thi
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
          In chứng nhận
        </Button>
      </div>

      <article className="rounded-2xl border-4 border-double border-amber-400 bg-gradient-to-b from-amber-50 to-white px-5 py-10 text-center shadow-sm sm:px-10 print:shadow-none">
        <Award className="mx-auto h-14 w-14 text-amber-500" aria-hidden="true" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">{siteConfig.name}</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Chứng nhận cuộc thi</h1>
        <p className="mt-6 text-sm text-gray-600">Chứng nhận</p>
        <p className="mt-1 break-words text-2xl font-bold text-primary-800 sm:text-3xl">{cert.user_name}</p>
        <p className="mt-4 text-sm text-gray-600">đã tham gia và {cert.rank !== null ? `đạt hạng ${cert.rank} tại` : "đạt chuẩn chứng nhận tại"} cuộc thi</p>
        <p className="mt-1 break-words text-lg font-semibold text-gray-900">{cert.contest_title}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-1 text-xs text-gray-500 sm:flex-row sm:gap-6">
          <span>Số chứng nhận: {cert.certificate_number}</span>
          <span>Ngày cấp: {formatContestDateTime(cert.issued_at)}</span>
        </div>
      </article>
    </div>
  );
}
