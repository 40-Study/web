/**
 * Nhãn "lớp · buổi" của một dòng điểm danh (QA5 S5-14). Thiếu cả hai (backend cũ) -> `null`.
 */
export function attendanceSessionLabel(a: { class_name?: string; session_title?: string }): string | null {
  const parts = [a.class_name?.trim(), a.session_title?.trim()].filter((p): p is string => !!p);
  return parts.length > 0 ? parts.join(" · ") : null;
}
