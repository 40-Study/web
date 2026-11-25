// ─── Auth Config ─────────────────────────────────────────────────────────────

export const AUTH_CONFIG = {
  OTP_LENGTH: 6,
  OTP_COUNTDOWN_SECONDS: 90,
} as const;

export const ROLE_NAME_MAP: Record<string, string> = {
  student: "STUDENT",
  teacher: "TEACHER",
  parent: "PARENT",
  admin: "SYSTEM_ADMIN",
} as const;

// ─── Storage Keys ────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  DEVICE_ID: "device_id",
  // Chỉ lưu email: "Gửi lại mã" gọi POST /auth/register/resend-otp {email}, backend giữ phần còn lại của đăng
  // ký đang chờ. Trước đây lưu cả mật khẩu dạng rõ trong sessionStorage (N-07, QA4 261123 / P-08 QA3).
  REGISTER_EMAIL: "register_email",
  // Khoá CŨ từng giữ mật khẩu dạng rõ. Không ghi nữa; /otp và /register/form xoá khi mở để dọn tab còn sót
  // từ trước bản sửa (review web#123 #4). Bỏ khoá này khi không còn tab nào có thể giữ nó.
  LEGACY_REGISTER_PAYLOAD: "register_payload",
  RESET_PASSWORD_EMAIL: "reset_password_email",
  // Mã OTP quên mật khẩu người dùng vừa gõ; chỉ được backend kiểm ở bước đặt mật khẩu mới (reset-password).
  RESET_PASSWORD_OTP: "reset_password_otp",
  // Câu lỗi "mã SAI" (còn lượt thử) bước đặt mật khẩu để lại cho /forgot-password/otp; đọc một lần.
  RESET_PASSWORD_OTP_ERROR: "reset_password_otp_error",
  // Mã đã CHẾT (hết hạn / hết lượt, backend đã xoá): /forgot-password điền sẵn email và hiện câu giải thích;
  // cả hai đọc một lần (Q5-PG-05 review M1).
  RESET_PASSWORD_PREFILL_EMAIL: "reset_password_prefill_email",
  RESET_PASSWORD_GONE_NOTICE: "reset_password_gone_notice",
  // Email điền sẵn cho /register/form khi đăng ký đang chờ đã hết hạn (410 từ resend-otp); form đọc rồi xoá.
  REGISTER_PREFILL_EMAIL: "register_prefill_email",
  // Cờ dùng một lần do bước trước đặt; trang thành công chỉ hiện khi có cờ, mở thẳng URL thì về /login (N-11).
  REGISTER_SUCCESS_FLAG: "register_success",
  RESET_PASSWORD_SUCCESS_FLAG: "reset_password_success",
} as const;

// ─── App Config ──────────────────────────────────────────────────────────────

export const APP_VERSION = "1.0.0";

// ─── Site Config ─────────────────────────────────────────────────────────────

/**
 * Ngày cập nhật gần nhất của Điều khoản dịch vụ và Chính sách bảo mật (dd/MM/yyyy) — SSOT cho cả hai trang
 * (Q7-PG-04: "Cập nhật lần cuối: 2026" chỉ có năm trông như chưa hoàn thiện). Đổi khi nội dung hai trang đổi.
 */
export const LEGAL_PAGES_LAST_UPDATED = "25/11/2026";

export const siteConfig = {
    name: "ForteX",
    // Email hỗ trợ chính thức (chủ dự án chốt 29/09) — SSOT cho footer, /help, điều khoản, bảo mật.
    supportEmail: "support@fortex.edu.vn",
    tagline: "Learn Leap Lead",
    description: "ForteX - Learn Leap Lead | Nền tảng học tập và quản lý hiện đại",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ogImage: "/og.png",
    links: {
        github: "#",
        facebook: "#",
    },
} as const;

export const navItems = [
    {
        title: "Trang chủ",
        href: "/",
    },
    {
        title: "Khoá học",
        href: "/courses",
    },
    {
        title: "Giới thiệu",
        href: "/about",
    },
    {
        title: "Liên hệ",
        href: "/contact",
    },
] as const;
