/**
 * Platform permission constants
 * Matches backend permission definitions
 */

export const PERMISSIONS = {
  // System Admin
  MANAGE_USERS: "manage_users",
  MANAGE_ORGANIZATIONS: "manage_organizations",
  MANAGE_ROLES: "manage_roles",
  MANAGE_PERMISSIONS: "manage_permissions",
  VIEW_SYSTEM_ANALYTICS: "view_system_analytics",
  MANAGE_SYSTEM_SETTINGS: "manage_system_settings",
  MANAGE_TEACHER_APPLICATIONS: "manage_teacher_applications",
  MANAGE_ALL_CLASSES: "manage_all_classes",
  IMPERSONATE_USER: "impersonate_user",
  VIEW_AUDIT_LOGS: "view_audit_logs",

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
