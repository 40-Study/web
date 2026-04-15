/**
 * Certificate service — certificate issuance and verification
 * Endpoints: /certificates
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id: string;
  certificate_number: string;
  issued_at: string;
  pdf_url?: string;
  course?: {
    id: string;
    title: string;
    thumbnail?: string;
  };
  user?: {
    id: string;
    name: string;
  };
  created_at?: string;
}

export interface IssueCertificateDTO {
  course_id: string;
  enrollment_id: string;
}

export interface VerifyCertificateResponse {
  valid: boolean;
  certificate?: Certificate;
  holder_name?: string;
  course_title?: string;
  issued_at?: string;
}

export interface CertificateListResponse {
  certificates: Certificate[];
  total: number;
  page: number;
  page_size: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const certificateService = {
  /** POST /certificates — issue certificate */
  issue: (data: IssueCertificateDTO) =>
    api.post<R<Certificate>>("/certificates", data).then((r) => r.data.data),

  /** GET /certificates — get my certificates */
  list: (params?: { page?: number; page_size?: number }) =>
    api
      .get<R<CertificateListResponse>>("/certificates", { params })
      .then((r) => r.data.data),

  /** GET /certificates/:id — get certificate by ID */
  getById: (id: string) =>
    api.get<R<Certificate>>(`/certificates/${id}`).then((r) => r.data.data),

  /** GET /certificates/verify/:certificateNumber — verify certificate (public) */
  verify: (certificateNumber: string) =>
    api
      .get<R<VerifyCertificateResponse>>(`/certificates/verify/${certificateNumber}`)
      .then((r) => r.data.data),
};
