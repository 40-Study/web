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
