"use client";

import Link from "next/link";
import { useState } from "react";
import { CertificateCard } from "@/components/certificate/certificate-card";
import { useMyCertificates } from "@/hooks/queries/use-certificates";

const PAGE_SIZE = 12;

export default function MyCertificatesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyCertificates({
    page,
    page_size: PAGE_SIZE,
  });

  const certificates = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Chứng chỉ của tôi
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Chứng chỉ nhận được sau khi hoàn thành khóa học.
          </p>
        </div>
        <Link
          href="/certificates/verify"
          className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Tra cứu chứng chỉ
        </Link>
      </header>

      {isLoading ? (
        <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500">
          Đang tải…
        </div>
      ) : certificates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            Bạn chưa có chứng chỉ nào. Hoàn thành một khóa học để nhận chứng
            chỉ đầu tiên.
          </p>
          <Link
            href="/my-courses"
            className="mt-4 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Tới khóa học của tôi
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((c) => (
              <CertificateCard key={c.id} certificate={c} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-gray-500">
                Trang {page}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
