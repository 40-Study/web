/**
 * Lỗi chốt kết quả vì voucher của giải không phát được (409 CONTEST_VOUCHER_UNAVAILABLE, ĐÍNH CHÍNH 3
 * contract 29/09). Backend rollback TOÀN BỘ lần chốt và trả `details` chỉ ra người thắng + voucher
 * hỏng, để admin sửa giải rồi chốt lại. Chỉ route admin trả `details`.
 */

import { ContestApiError } from "@/services/contest.service";

export interface VoucherGrantErrorDetails {
  user_id: string;
  user_name: string;
  rank: number;
  voucher_id: string;
  /** Rỗng khi voucher đã bị xoá. */
  voucher_code: string;
  reason: string;
}

export interface VoucherGrantError {
  /** Câu đầy đủ tiếng Việt backend dựng sẵn (có thể rỗng ở bản build cũ). */
  message: string;
  details: VoucherGrantErrorDetails;
}

function isDetails(value: unknown): value is VoucherGrantErrorDetails {
  if (!value || typeof value !== "object") return false;
  const d = value as Record<string, unknown>;
  return (
    typeof d.user_name === "string" &&
    typeof d.rank === "number" &&
    typeof d.voucher_code === "string" &&
    typeof d.reason === "string"
  );
}

/** Trả thông tin lỗi voucher khi chốt, hoặc null nếu không phải lỗi này / thiếu `details` hợp lệ. */
export function parseVoucherGrantError(error: unknown): VoucherGrantError | null {
  if (!(error instanceof ContestApiError) || error.code !== "CONTEST_VOUCHER_UNAVAILABLE") return null;
  if (!isDetails(error.payload)) return null;
  return { message: error.message, details: error.payload };
}

/** Nhãn voucher cho người đọc: mã, hoặc ghi rõ đã bị xoá khi backend trả mã rỗng. */
export function voucherGrantLabel(details: VoucherGrantErrorDetails): string {
  return details.voucher_code ? details.voucher_code : "voucher đã bị xoá";
}
