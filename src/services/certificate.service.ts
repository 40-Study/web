/**
 * Certificate service — certificate issuance and verification
 * Endpoints: /certificates
 *
 * Contract source (verified 2026-07-30, backend @ 6ca6179):
 *   internal/dto/certificateDTO.go          — CertificateResponseDTO, CertificateListDTO,
 *                                             VerifyCertificateResponseDTO
 *   internal/handler/certificate_handler.go — mọi response bọc trong {message, data}
 *
 * LƯU Ý: field phẳng (user_name, course_name), KHÔNG lồng object.
 * `certificate_url` hiện LUÔN null — backend publish message vào queue
 * `certificate.generate` nhưng không có consumer nào và go.mod không có thư viện PDF.
 * Web phải tự render chứng chỉ client-side.
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Khớp CertificateResponseDTO */
export interface Certificate {
  id: string;
  user_id: string;
  user_name: string;
  course_id: string;
  course_name: string;
  enrollment_id: string;
  certificate_number: string;
  /** Backend `*string` + omitempty — hiện luôn null, xem ghi chú đầu file */
  certificate_url?: string;
  issued_at: string;
  created_at: string;
}

export interface IssueCertificateDTO {
  course_id: string;
  enrollment_id: string;
}

/** Khớp VerifyCertificateResponseDTO — field phẳng, không có object lồng */
export interface VerifyCertificateResponse {
  valid: boolean;
  certificate_number: string;
  /** omitempty — vắng khi valid = false */
  user_name?: string;
  /** omitempty — vắng khi valid = false */
  course_name?: string;
  /** omitempty — vắng khi valid = false */
  issued_at?: string;
}

/** Khớp CertificateListDTO — mảng nằm ở `data`, KHÔNG phải `certificates` */
export interface CertificateListResponse {
  data: Certificate[];
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

  /** GET /certificates/verify/:certificateNumber — verify certificate (PUBLIC, no auth) */
  verify: (certificateNumber: string) =>
    api
      .get<R<VerifyCertificateResponse>>(
        `/certificates/verify/${certificateNumber}`
      )
      .then((r) => r.data.data),
};
