// ─── Auth Config ─────────────────────────────────────────────────────────────

export const AUTH_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
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
  REGISTER_EMAIL: "register_email",
  // Lưu tạm password/confirm_password/user_name/full_name (KHÔNG lưu OTP) để
  // trang /otp gọi lại POST /auth/register/request khi người dùng bấm "Gửi
  // lại mã" — backend không có endpoint resend riêng, chỉ có request lại với
  // đầy đủ payload (QA khách P1, 260927).
  REGISTER_PAYLOAD: "register_payload",
  RESET_PASSWORD_EMAIL: "reset_password_email",
} as const;

// ─── App Config ──────────────────────────────────────────────────────────────

export const APP_VERSION = "1.0.0";

// ─── Site Config ─────────────────────────────────────────────────────────────

export const siteConfig = {
    name: "ForteX",
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
        title: "Khóa học",
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
