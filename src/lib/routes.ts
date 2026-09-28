export const AUTH_ROUTES = {
  LOGIN: "/login",
  LOGIN_ROLE: "/login/role",
  LOGIN_ORGANIZATION: "/login/organization",
  LOGIN_CHILDREN: "/login/children",
  REGISTER: "/register",
  REGISTER_FORM: "/register/form",
  REGISTER_ROLE: "/register/role",
  REGISTER_SUCCESS: "/register/success",
  OTP: "/otp",
  FORGOT_PASSWORD: "/forgot-password",
  FORGOT_PASSWORD_OTP: "/forgot-password/otp",
  RESET_PASSWORD: "/reset-password",
  RESET_PASSWORD_SUCCESS: "/reset-password/success",
  ACCEPT_INVITATION: "/accept-invitation",
} as const;

// Role-based home routes
export const ROLE_HOME_ROUTES: Record<string, string> = {
  STUDENT: "/home",
  TEACHER: "/teacher/schedule",
  PARENT: "/home",
  SYSTEM_ADMIN: "/admin",
  ORG_OWNER: "/admin",
  // Phase 3: ứng viên chưa có quyền giảng dạy — trang duy nhất có ý nghĩa là hồ sơ ứng tuyển.
  TEACHER_APPLICANT: "/teacher-application",
} as const;

const ROLE_ALIASES: Record<string, string> = {
  ADMIN: "SYSTEM_ADMIN",
};

/** Normalize role to uppercase string. Accepts string or UnifiedRole object. */
export function normalizeRole(role?: string | { role_name: string } | null): string | null {
  if (!role) return null;
  const name = typeof role === "string" ? role : role.role_name;
  const normalized = name.trim().toUpperCase();
  return ROLE_ALIASES[normalized] || normalized;
}

// Get home route based on role (fallback to student home)
export function getRoleHomeRoute(role?: string | null): string {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return ROLE_HOME_ROUTES.STUDENT;
  return ROLE_HOME_ROUTES[normalizedRole] || ROLE_HOME_ROUTES.STUDENT;
}

// Route công khai/dùng chung, không thuộc luồng auth (H-06 — footer/checkout cần
// đích thật thay vì href="#" hoặc route chưa tồn tại).
export const COMMON_ROUTES = {
  TERMS: "/terms",
  PRIVACY: "/privacy",
  NOTIFICATIONS: "/notifications",
} as const;

export const ROUTES = {
  HOME: "/",
  ...AUTH_ROUTES,
  ...COMMON_ROUTES,
} as const;

// ─── Role-scoped route access (review PR #26 MAJOR #1) ─────────────────────
//
// Trước đây `sidebar.tsx`/`bottom-nav.tsx` tự quyết định menu hiển thị gì
// theo role, còn `(app)/layout.tsx` chỉ kiểm role có thuộc nhóm
// STUDENT/TEACHER/PARENT hay không cho TOÀN BỘ `(app)/**` — không phân biệt
// sub-route. Kết quả: phụ huynh ẩn "Cuộc thi"/"Nhóm"/"Xu"/"Thành tích" khỏi
// menu nhưng gõ thẳng URL vẫn vào được y nguyên nội dung game-hoá của học
// sinh. Bảng này là NGUỒN DUY NHẤT cho cả hai — `sidebar.tsx` lọc menu bằng
// nó, `(app)/layout.tsx` lọc route bằng nó — nên không thể lệch nhau nữa.

export type NavRole = "GUEST" | "STUDENT" | "PARENT" | "ADMIN";

/**
 * Vai trò "điều hướng" hiện tại — dùng chung bởi Sidebar/BottomNav/AppLayout
 * thay vì mỗi nơi tự viết lại ternary GUEST/ADMIN/PARENT/STUDENT (nguồn của
 * chính lỗi MAJOR #1: 3 chỗ suy role độc lập, dễ lệch).
 */
export function resolveNavRole(isAuthenticated: boolean, normalizedRole: string | null): NavRole {
  if (!isAuthenticated) return "GUEST";
  if (normalizedRole === "SYSTEM_ADMIN" || normalizedRole === "ORG_OWNER") return "ADMIN";
  if (normalizedRole === "PARENT") return "PARENT";
  return "STUDENT";
}

interface RoleScopedRoute {
  /** Route tĩnh (không có tham số động) trong `(app)/**`. */
  href: string;
  /** Vai trò được vào route này. Không nằm trong bảng => không bị hạn chế bởi cơ chế này. */
  roles: NavRole[];
}

/**
 * Mọi route "học sinh/game-hoá" phụ huynh không cần tới — kể cả
 * "/leaderboard" (chỉ có link ở bottom-nav mobile học sinh, KHÔNG có trong
 * sidebar desktop) vẫn phải nằm ở đây vì đây là bảng gate ROUTE, không phải
 * bảng "menu item nào tồn tại".
 */
export const ROLE_SCOPED_ROUTES: RoleScopedRoute[] = [
  { href: "/contests", roles: ["GUEST", "STUDENT"] },
  { href: "/my-courses", roles: ["STUDENT"] },
  { href: "/schedule", roles: ["STUDENT"] },
  { href: "/my-attendance", roles: ["STUDENT"] },
  { href: "/certificates", roles: ["STUDENT"] },
  { href: "/groups", roles: ["STUDENT"] },
  { href: "/coins", roles: ["STUDENT"] },
  { href: "/achievements", roles: ["STUDENT"] },
  { href: "/leaderboard", roles: ["STUDENT"] },
  { href: "/settings/family", roles: ["STUDENT", "PARENT"] },
  { href: "/messages", roles: ["STUDENT", "PARENT"] },
];

/**
 * `pathname` không khớp entry nào => route này không do bảng trên quản lý
 * (vd `/notifications`, `/checkout`, `/cart`...) => luôn cho qua ở tầng này.
 */
export function isRouteAllowedForRole(pathname: string, role: NavRole): boolean {
  const entry = ROLE_SCOPED_ROUTES.find(
    (r) => pathname === r.href || pathname.startsWith(`${r.href}/`)
  );
  if (!entry) return true;
  return entry.roles.includes(role);
}
