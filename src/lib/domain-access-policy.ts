export const DOMAIN_ACCESS_POLICY = {
  teacher: ["TEACHER"],
  classroom: ["TEACHER", "STUDENT"],
  admin: ["SYSTEM_ADMIN", "ORG_OWNER"],
} as const;
