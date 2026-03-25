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
} as const;

// Role-based home routes
export const ROLE_HOME_ROUTES: Record<string, string> = {
  STUDENT: "/home",
  TEACHER: "/teacher/schedule",
  PARENT: "/home",
  SYSTEM_ADMIN: "/admin",
  ORG_OWNER: "/admin",
} as const;

export function normalizeRole(role?: string | null): string | null {
  if (!role) return null;
  return role.trim().toUpperCase();
}

// Get home route based on role (fallback to student home)
export function getRoleHomeRoute(role?: string | null): string {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return ROLE_HOME_ROUTES.STUDENT;
  return ROLE_HOME_ROUTES[normalizedRole] || ROLE_HOME_ROUTES.STUDENT;
}

export const ROUTES = {
  HOME: "/",
  ...AUTH_ROUTES,
} as const;
