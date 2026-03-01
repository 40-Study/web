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

export const ROUTES = {
  HOME: "/",
  ...AUTH_ROUTES,
} as const;
