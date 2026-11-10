/**
 * Thao tác ghi (tạo/xoá) mà client không nhận được câu trả lời (QA-B-03, QA-C-16, 261110).
 *
 * Axios timeout 15s chỉ huỷ phía trình duyệt; request đã tới server vẫn chạy tiếp và thường xong.
 * Coi đó là "thất bại" thì người dùng bấm lại và tạo bản trùng, hoặc thấy danh sách cũ dù server đã
 * xoá. Cách đúng: báo "chưa rõ kết quả", tải lại dữ liệu từ server và đối chiếu.
 */

import { ApiError, NetworkError } from "./errors";

/**
 * Không có response (timeout/huỷ/mất mạng) hoặc cổng trung gian hết giờ (502/503/504/408): server
 * có thể đã thực hiện thao tác. 500 hay 4xx là server đã trả lời dứt khoát → lỗi bình thường.
 */
export function isUncertainOutcomeError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  return error instanceof ApiError && [408, 502, 503, 504].includes(error.status);
}

export type ReconcileResult = "confirmed" | "unconfirmed";

/**
 * Tải lại dữ liệu từ server rồi kiểm tra thao tác đã có hiệu lực chưa. `verify` tự refetch và trả
 * true khi thấy kết quả. Refetch cũng lỗi (server vẫn chậm) → "unconfirmed", không đoán.
 */
export async function reconcileUncertainOutcome(verify: () => Promise<boolean>): Promise<ReconcileResult> {
  try {
    return (await verify()) ? "confirmed" : "unconfirmed";
  } catch {
    return "unconfirmed";
  }
}

/** Đếm số mục có tiêu đề trùng khớp (so sánh sau trim), dùng để biết bản ghi mới đã xuất hiện chưa. */
export function countByTitle(items: unknown, title: string): number {
  if (!Array.isArray(items)) return 0;
  const target = title.trim();
  return items.filter((item: { title?: unknown } | null) => String(item?.title ?? "").trim() === target).length;
}

export const UNCERTAIN_OUTCOME_TITLE = "Chưa rõ kết quả";

/** Mô tả cho trường hợp đã tải lại mà vẫn chưa thấy thay đổi: máy chủ có thể vẫn đang xử lý. */
export function uncertainOutcomeDescription(action: string): string {
  return `Máy chủ phản hồi quá lâu nên chưa xác nhận được việc ${action}. Danh sách đã được tải lại nhưng chưa thấy thay đổi; máy chủ có thể vẫn đang xử lý. Đợi một lát rồi kiểm tra lại trước khi thử lần nữa để tránh bị trùng.`;
}
