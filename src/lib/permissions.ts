/**
 * Platform permission constants
 * Matches backend permission definitions
 */

export const PERMISSIONS = {
  // System Admin
  MANAGE_USERS: "manage_users",
  // Hai giá trị dưới phải TRÙNG tên permission backend gác route tương ứng (POST /organizations,
  // nhóm /system-roles), nếu không <Can> sẽ không bao giờ hiện nút cho admin.
  MANAGE_ORGANIZATIONS: "ORG_CREATE",
  MANAGE_ROLES: "ROLES_MANAGE_SYSTEM",
  // Phase 1 quản lý người dùng (2026-09-27): trùng tên permission backend seed sẵn,
  // trang /admin/users cần CẢ 2 (xem danh sách khác quyền khoá/mở khoá).
  USERS_VIEW_ALL: "USERS_VIEW_ALL",
  USERS_BAN: "USERS_BAN",
  MANAGE_PERMISSIONS: "manage_permissions",
  VIEW_SYSTEM_ANALYTICS: "view_system_analytics",
  MANAGE_SYSTEM_SETTINGS: "manage_system_settings",
  MANAGE_TEACHER_APPLICATIONS: "manage_teacher_applications",
  MANAGE_ALL_CLASSES: "manage_all_classes",
  IMPERSONATE_USER: "impersonate_user",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  // Đơn hàng admin + hoàn tiền + báo cáo doanh thu (quyết định chủ dự án 27/09/2026). Giá trị PHẢI
  // khớp tên permission thật ở backend (data/permissions/system_admin_permissions.json) — khác
  // với MANAGE_SYSTEM_SETTINGS/VIEW_SYSTEM_ANALYTICS phía trên (placeholder chưa từng khớp
  // backend thật, 0 nơi dùng), 2 hằng số này gate thật cho trang /admin/orders và mục cấu hình
  // % phí ở /admin/reports.
  MANAGE_PAYMENTS: "PAYMENTS_MANAGE",
  MANAGE_PLATFORM_FEE: "SYSTEM_SETTINGS_MANAGE",
  // Phase 3 duyệt khoá học (28/09/2026) — tên permission thật đã seed ở backend. BẮT BUỘC có
  // trong bảng này: auth-session.ts lọc bỏ mọi permission server trả về mà không nằm ở đây,
  // thiếu thì <Can> không bao giờ hiện nút Duyệt/Từ chối.
  COURSES_APPROVE_ALL: "COURSES_APPROVE_ALL",
  // Phase 4 (rút tiền giảng viên, 28/09/2026) — gate trang /admin/withdrawals + nút
  // duyệt/từ chối/đánh dấu đã chuyển. Giá trị PHẢI khớp tên permission thật ở backend
  // (data/permissions/system_admin_permissions.json), theo đúng withdrawal-contract.md.
  WALLET_WITHDRAWALS_MANAGE: "WALLET_WITHDRAWALS_MANAGE",

  // Org Owner
  MANAGE_ORG_MEMBERS: "manage_org_members",
  MANAGE_ORG_ROLES: "manage_org_roles",
  MANAGE_ORG_SETTINGS: "manage_org_settings",
  VIEW_ORG_ANALYTICS: "view_org_analytics",
  MANAGE_ORG_CLASSES: "manage_org_classes",
  MANAGE_ORG_TEACHERS: "manage_org_teachers",
  MANAGE_ORG_BILLING: "manage_org_billing",

  // Teacher
  CREATE_CLASS: "create_class",
  MANAGE_OWN_CLASSES: "manage_own_classes",
  GRADE_ASSIGNMENTS: "grade_assignments",
  VIEW_CLASS_ANALYTICS: "view_class_analytics",

  // Teacher Applicant
  SUBMIT_APPLICATION: "submit_application",
  VIEW_APPLICATION_STATUS: "view_application_status",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// System roles
export const SYSTEM_ROLES = {
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  ORG_OWNER: "ORG_OWNER",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
  TEACHER_APPLICANT: "TEACHER_APPLICANT",
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
