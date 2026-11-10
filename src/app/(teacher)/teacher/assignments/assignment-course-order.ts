import type { ApiCourse } from "@/services/course.service";

export interface AssignmentCourseOption {
  id: string;
  title: string;
  status: string;
  isPublished: boolean;
}

// Khoá đang bán đứng đầu; khoá chờ duyệt/nháp/bị từ chối là việc soạn bài, hiếm khi có buổi trực tiếp để giao bài.
const STATUS_RANK: Record<string, number> = { published: 0, archived: 1, pending_review: 2, draft: 3, rejected: 4 };

function timeOf(c: ApiCourse): number {
  const t = new Date(c.published_at ?? c.updated_at ?? c.created_at ?? "").getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * QA-B-08: trang Quản lý bài tập từng giữ nguyên thứ tự API (khoá bị từ chối đứng đầu) và chọn sẵn phần tử đầu,
 * nên cột "Buổi học" báo "chưa có buổi học" ngay khi mở trang, 11 khoá nháp/rác lẫn vào giữa.
 * Xếp theo trạng thái rồi mới nhất trước; chọn sẵn khoá đã xuất bản gần nhất.
 */
export function orderAssignmentCourses(courses: ApiCourse[]): {
  published: AssignmentCourseOption[];
  others: AssignmentCourseOption[];
  defaultId: string;
} {
  const sorted = [...courses].sort(
    (a, b) =>
      (STATUS_RANK[a.status ?? ""] ?? 5) - (STATUS_RANK[b.status ?? ""] ?? 5) || timeOf(b) - timeOf(a),
  );
  const options = sorted.map((c) => ({
    id: c.id,
    title: c.title,
    status: c.status ?? "",
    isPublished: c.status === "published",
  }));
  const published = options.filter((c) => c.isPublished);
  return {
    published,
    others: options.filter((c) => !c.isPublished),
    defaultId: published[0]?.id ?? options[0]?.id ?? "",
  };
}
