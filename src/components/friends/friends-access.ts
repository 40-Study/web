import { normalizeRole } from "@/lib/routes";

/**
 * Bạn bè chỉ dành cho học viên (contract §0). Khoá theo vai THẬT đang dùng (`activeRole`), không theo
 * `resolveNavRole` vì hàm đó quy TEACHER về STUDENT để dựng menu. Học viên có thêm vai phụ
 * (PARENT/TEACHER_APPLICANT/ORG_OWNER) vẫn là STUDENT; TEACHER đã duyệt và SYSTEM_ADMIN thì không.
 */
export function canUseFriends(activeRole?: string | null): boolean {
  return normalizeRole(activeRole) === "STUDENT";
}