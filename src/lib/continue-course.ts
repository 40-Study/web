import type { EnrolledCourse } from "@/types/course";

type ContinueCandidate = Pick<EnrolledCourse, "id" | "progress" | "lastAccessedAt" | "enrolledAt">;

const time = (iso?: string): number => Date.parse(iso ?? "") || 0;

/**
 * Thứ tự "học tiếp": truy cập gần nhất trước; hoà thì khoá đã học nhiều hơn, rồi ghi danh muộn hơn, cuối cùng
 * theo id — tất định, không phụ thuộc thứ tự mảng backend trả (QA3 Q9: seed có cùng `last_accessed_at`).
 */
export function compareByRecentAccess(a: ContinueCandidate, b: ContinueCandidate): number {
  return (
    time(b.lastAccessedAt) - time(a.lastAccessedAt) ||
    b.progress - a.progress ||
    time(b.enrolledAt) - time(a.enrolledAt) ||
    String(a.id).localeCompare(String(b.id))
  );
}

/**
 * Khoá để nút "Tiếp tục học" mở — MỘT bộ chọn dùng chung cho /home và /my-courses.
 * Ưu tiên khoá đang học dở (0 < tiến độ < 100); không có thì khoá chưa bắt đầu; xong hết thì `undefined`.
 */
export function pickContinueCourse<T extends ContinueCandidate>(courses: readonly T[]): T | undefined {
  const unfinished = courses.filter((c) => c.progress < 100).sort(compareByRecentAccess);
  return unfinished.find((c) => c.progress > 0) ?? unfinished[0];
}
