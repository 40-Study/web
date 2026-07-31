/**
 * Server-side fetch cho endpoint chứng chỉ CÔNG KHAI.
 *
 * Cố tình KHÔNG dùng `serverFetch` của lib/server-api.ts: hàm đó forward
 * cookie người dùng, mà `/certificates/verify/:number` là endpoint public
 * (certificate_router.go:20) — gửi cookie sang là thừa và làm lộ phiên đăng
 * nhập trong một request không cần danh tính.
 */

import type { VerifyCertificateResponse } from "@/services/certificate.service";
import { getPublicApiBaseUrl } from "./base-url";

/**
 * Trả null khi số chứng chỉ không tồn tại (backend trả 404) hoặc backend lỗi
 * — trang gọi hàm này tự hiển thị trạng thái "không tìm thấy".
 */
export async function verifyCertificateServer(
  certificateNumber: string
): Promise<VerifyCertificateResponse | null> {
  try {
    const res = await fetch(
      `${getPublicApiBaseUrl()}/certificates/verify/${encodeURIComponent(certificateNumber)}`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: VerifyCertificateResponse;
    };
    return json.data ?? null;
  } catch {
    // Backend down / DNS lỗi -> coi như không xác minh được, không làm vỡ trang
    return null;
  }
}
