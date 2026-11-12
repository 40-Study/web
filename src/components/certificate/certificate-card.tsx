"use client";

import Link from "next/link";
import { Award } from "lucide-react";
import type { Certificate } from "@/services/certificate.service";

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
}

export function CertificateCard({ certificate }: { certificate: Certificate }) {
  return (
    <Link
      href={`/certificates/${certificate.id}`}
      className="group flex flex-col rounded-xl border border-border p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/40 dark:hover:border-primary-500/30"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400">
          <Award className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground group-hover:text-primary-700 dark:group-hover:text-primary-300">
            {certificate.course_name || "Chứng chỉ"}
          </p>
          <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
            {certificate.certificate_number}
          </p>
        </div>
      </div>

      {certificate.issued_at && (
        <p className="mt-3 text-xs text-muted-foreground">
          Cấp ngày {formatDate(certificate.issued_at)}
        </p>
      )}
    </Link>
  );
}
