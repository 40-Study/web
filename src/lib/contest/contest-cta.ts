/**
 * `resolveContestCta` — hành động chính ở trang chi tiết cuộc thi (contract §7, đoạn "CTA trang
 * chi tiết"). Hàm THUẦN: chỉ đọc `viewer` backend trả về (backend đã tính quyền, chỗ, khoá học,
 * phase theo đồng hồ server) cộng vai trò hiện tại để chọn câu chữ; không tự suy quyền lại ở web.
 *
 * Lệch contract có chủ đích: contract ghi link đăng nhập `/login?next=`, nhưng trang login chỉ đọc
 * `?redirect=` (qua `sanitizeRedirect`), nên dùng `?redirect=`.
 */
import type { ContestDetail } from "@/types/contest";

export type ContestCta =
  | { kind: "login"; label: string; href: string }
  | { kind: "buy-course"; label: string; href: string; message: string }
  | { kind: "join"; label: string }
  | { kind: "countdown"; label: string; targetTime: string }
  | { kind: "start"; label: string; href: string }
  | { kind: "continue"; label: string; href: string }
  | { kind: "result"; label: string; href: string; certificateHref: string | null }
  | { kind: "expired"; message: string }
  | { kind: "info"; message: string };

export function contestPath(slug: string, sub?: "play" | "result" | "certificate"): string {
  const base = `/contests/${encodeURIComponent(slug)}`;
  return sub ? `${base}/${sub}` : base;
}

export function contestLoginHref(slug: string): string {
  return `/login?redirect=${encodeURIComponent(contestPath(slug))}`;
}

/** Câu giải thích khi vai trò hiện tại không được dự thi (backend trả ROLE_NOT_ALLOWED). */
function roleNotAllowedMessage(activeRole: string | null): string {
  switch (activeRole) {
    case "PARENT":
      return "Chỉ học viên được tham gia cuộc thi. Phụ huynh có thể xem thông tin và bảng xếp hạng.";
    case "TEACHER":
      return "Giảng viên không dự thi. Bạn chỉ xem được thông tin cuộc thi.";
    case "SYSTEM_ADMIN":
    case "ORG_OWNER":
      return "Quản trị viên chỉ xem, không dự thi.";
    default:
      return "Chỉ học viên được tham gia cuộc thi.";
  }
}

/**
 * @param detail dữ liệu `GET /contests/:slug`
 * @param activeRole vai trò đang dùng (đã chuẩn hoá chữ hoa), `null` với khách
 */
export function resolveContestCta(detail: ContestDetail, activeRole: string | null): ContestCta {
  const { viewer, phase, slug } = detail;
  const mine = viewer.my_participation;

  if (mine) {
    switch (mine.attempt_status) {
      case "SUBMITTED": {
        const hasCertificate = !!mine.award?.certificate_number;
        return {
          kind: "result",
          label: "Xem kết quả",
          href: contestPath(slug, "result"),
          certificateHref: hasCertificate ? contestPath(slug, "certificate") : null,
        };
      }
      case "EXPIRED":
        return { kind: "expired", message: "Bạn đã hết giờ, bài không được tính." };
      case "IN_PROGRESS":
        return { kind: "continue", label: "Tiếp tục làm bài", href: contestPath(slug, "play") };
      case "NOT_STARTED":
        if (phase === "UPCOMING") {
          return { kind: "countdown", label: "Bạn đã đăng ký. Cuộc thi bắt đầu sau", targetTime: detail.start_time };
        }
        if (phase === "ACTIVE") {
          return { kind: "start", label: "Bắt đầu làm bài", href: contestPath(slug, "play") };
        }
        return { kind: "info", message: "Bạn đã đăng ký nhưng không làm bài trong thời gian thi." };
    }
  }

  if (viewer.can_join) return { kind: "join", label: "Đăng ký tham gia" };

  switch (viewer.join_block_reason) {
    case "LOGIN_REQUIRED":
      return { kind: "login", label: "Đăng nhập để tham gia", href: contestLoginHref(slug) };
    case "COURSE_REQUIRED":
      if (detail.course) {
        return {
          kind: "buy-course",
          label: "Mua khoá để tham gia",
          href: `/courses/${encodeURIComponent(detail.course.slug)}`,
          message: `Cuộc thi chỉ dành cho học viên của khoá "${detail.course.title}".`,
        };
      }
      return { kind: "info", message: "Cuộc thi chỉ dành cho học viên của khoá học liên kết." };
    case "ROLE_NOT_ALLOWED":
      return { kind: "info", message: roleNotAllowedMessage(activeRole) };
    case "OWNER":
      return { kind: "info", message: "Bạn là người tạo cuộc thi này nên không thể tham gia." };
    case "FULL":
      return { kind: "info", message: "Cuộc thi đã đủ số người tham gia." };
    case "CLOSED":
      return { kind: "info", message: "Cuộc thi đã đóng đăng ký." };
    case "ALREADY_JOINED":
      return { kind: "info", message: "Bạn đã đăng ký cuộc thi này." };
    default:
      return { kind: "info", message: "Hiện chưa thể tham gia cuộc thi này." };
  }
}
