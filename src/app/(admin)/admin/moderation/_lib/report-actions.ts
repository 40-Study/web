/**
 * ADM-N4 / ADM-A3 (QA2 261013): hành động kiểm duyệt từ báo cáo và link tới đối tượng bị báo cáo.
 *
 * Dữ liệu đối tượng + danh sách hành động áp dụng được do backend trả sẵn trong `report.target`
 * (contract BE3 §1a). Hằng số ở đây chỉ là NHÃN hiển thị của từng hành động; hành động nào được phép với báo
 * cáo nào do `target.available_actions` quyết định, không suy từ `reported_type`.
 */

import { ApiError } from "@/lib/errors";
import { getErrorMessage } from "@/lib/error-messages";
import type { Report, ReportModerationAction } from "@/services/report.service";

export interface ReportActionSpec {
  /** Nút mở hộp thoại ở khung chi tiết. */
  button: string;
  /** Tiêu đề hộp thoại. */
  title: string;
  description: string;
  /** Nút xác nhận trong hộp thoại. */
  confirm: string;
  /** Nhãn ô lý do; vắng = hành động không cần lý do. */
  reasonLabel?: string;
  /** Toast khi thành công. */
  success: string;
}

export const REPORT_ACTION_SPECS: Record<ReportModerationAction, ReportActionSpec> = {
  unpublish_course: {
    button: "Gỡ khoá học khỏi danh mục",
    title: "Gỡ khoá học khỏi danh mục?",
    description:
      "Khoá học chuyển sang lưu trữ và biến mất khỏi danh mục công khai. Học viên đã ghi danh vẫn học được. Giảng viên nhận thông báo kèm lý do.",
    confirm: "Xác nhận gỡ khoá học",
    reasonLabel: "Lý do (gửi cho giảng viên)",
    success: "Đã gỡ khoá học khỏi danh mục",
  },
  hide_discussion: {
    button: "Ẩn bài thảo luận",
    title: "Ẩn bài thảo luận này?",
    description: "Bài viết biến mất khỏi danh sách thảo luận công khai. Có thể hiện lại sau.",
    confirm: "Xác nhận ẩn bài",
    reasonLabel: "Lý do",
    success: "Đã ẩn bài thảo luận",
  },
  unhide_discussion: {
    button: "Hiện lại bài thảo luận",
    title: "Hiện lại bài thảo luận này?",
    description: "Bài viết xuất hiện trở lại trong danh sách thảo luận công khai.",
    confirm: "Xác nhận hiện lại bài",
    success: "Đã hiện lại bài thảo luận",
  },
};

/** Backend yêu cầu lý do 3..500 ký tự (đã cắt khoảng trắng) cho hành động có `reasonLabel`. */
export const MIN_REASON_LENGTH = 3;
export const MAX_REASON_LENGTH = 500;

export interface ReportTargetLink {
  href: string;
  /** Trang công khai (khoá học, thảo luận): mở tab mới để không rời khỏi hàng đợi kiểm duyệt. */
  newTab: boolean;
}

/**
 * Nơi mở được đối tượng bị báo cáo, hoặc null khi không có (đã xoá, hoặc không có trang xem được):
 *  - khoá học: trang công khai khi đã xuất bản, còn lại trang duyệt khoá của admin
 *  - người dùng: trang admin
 *  - thảo luận: trang công khai, trừ khi đã ẩn (trang sẽ 404)
 *  - đánh giá: khoá học chứa nó
 */
export function getReportTargetLink(report: Report): ReportTargetLink | null {
  const t = report.target;
  if (!t || !t.exists) return null;
  switch (t.type) {
    case "course":
      return t.status === "published" && t.slug
        ? { href: `/courses/${t.slug}`, newTab: true }
        : { href: "/admin/courses", newTab: false };
    case "user":
      return { href: `/admin/users/${t.id}`, newTab: false };
    case "discussion":
      return t.slug && t.status !== "hidden" ? { href: `/discussions/${t.slug}`, newTab: true } : null;
    case "review":
      return t.course_slug ? { href: `/courses/${t.course_slug}`, newTab: true } : null;
    default:
      return null;
  }
}

const ACTION_ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_FAILED: `Lý do phải từ ${MIN_REASON_LENGTH} đến ${MAX_REASON_LENGTH} ký tự.`,
  ACTION_NOT_APPLICABLE: "Hành động này không áp dụng cho đối tượng bị báo cáo.",
  REPORT_NOT_FOUND: "Báo cáo không còn tồn tại.",
  TARGET_NOT_FOUND: "Đối tượng bị báo cáo đã bị xoá.",
  TARGET_STATE_UNCHANGED:
    "Đối tượng đã thay đổi trạng thái từ khi bạn mở báo cáo (có thể đã được xử lý). Danh sách đã được làm mới.",
};

export function getReportActionErrorMessage(error: unknown): string {
  if (error instanceof ApiError && ACTION_ERROR_MESSAGES[error.code]) return ACTION_ERROR_MESSAGES[error.code];
  return getErrorMessage(error, "Không thể thực hiện hành động này");
}
