export const DOMAIN_ACCESS_POLICY = {
  teacher: ["TEACHER"],
  classroom: ["TEACHER", "STUDENT"],
  dashboard: ["STUDENT", "TEACHER", "PARENT", "SYSTEM_ADMIN", "ORG_OWNER"],
} as const;
