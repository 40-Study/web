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
  RESET_PASSWORD_EMAIL: "reset_password_email",
  // Cờ dùng một lần do bước trước đặt; trang thành công chỉ hiện khi có cờ, mở thẳng URL thì về /login (N-11).
  REGISTER_SUCCESS_FLAG: "register_success",
  RESET_PASSWORD_SUCCESS_FLAG: "reset_password_success",
} as const;

// ─── App Config ──────────────────────────────────────────────────────────────

export const APP_VERSION = "1.0.0";

// ─── Site Config ─────────────────────────────────────────────────────────────

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
