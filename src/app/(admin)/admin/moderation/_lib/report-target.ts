/**
 * A3 (QA 261008): cột "Đối tượng bị báo cáo" ở /admin/moderation trước đây chỉ hiện loại + UUID
 * thô. Helper này tra TÊN hiển thị + link xem trước cho từng loại, dùng các endpoint đã có sẵn
 * (không thêm route backend):
 *  - user       → GET /users/:id       → tên/email, link /admin/users/:id
 *  - course     → GET /courses/:id     → tên khoá,  link /admin/courses (trang duyệt khoá của admin)
 *  - discussion → GET /discussions     → khớp uuid → tiêu đề. KHÔNG gắn link: route xem-theo-id
 *    nằm trong layout học viên (/discussions/:slug) nên admin mở sẽ bị đá về /admin.
 *  - review / comment / lesson → chưa có endpoint admin tra theo id → để trống, UI rơi về UUID.
 *
 * Lỗi tra cứu (403/404/mạng) chỉ làm đối tượng đó mất tên — không chặn cả trang.
 */

import { useQueries, useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { courseService } from "@/services/course.service";
import { discussionService } from "@/services/discussion.service";
import type { Report } from "@/services/report.service";

export interface ReportTargetMeta {
  /** Tên hiển thị cho admin (rỗng khi chưa tra được). */
  name?: string;
  /** Route xem trước (chỉ khi có nơi mở được hợp lệ với admin). */
  href?: string;
}

/** Khóa tra cứu theo đối tượng — nhiều report có thể cùng trỏ về một đối tượng. */
export function reportTargetKey(type: string, id: string): string {
  return `${type}:${id}`;
}

function uniqueIds(reports: Report[], type: string): string[] {
  return Array.from(new Set(reports.filter((r) => r.reported_type === type).map((r) => r.reported_id)));
}

export function useReportTargetMeta(reports: Report[]): Map<string, ReportTargetMeta> {
  const userIds = uniqueIds(reports, "user");
  const courseIds = uniqueIds(reports, "course");
  const hasDiscussion = reports.some((r) => r.reported_type === "discussion");

  const userQueries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ["report-target", "user", id],
      queryFn: () => userService.getById(id),
      staleTime: 5 * 60_000,
    })),
  });

  const courseQueries = useQueries({
    queries: courseIds.map((id) => ({
      queryKey: ["report-target", "course", id],
      queryFn: () => courseService.getCourseById(id),
      staleTime: 5 * 60_000,
    })),
  });

  // Danh sách thảo luận là endpoint công khai; tải 1 lần rồi khớp uuid → tiêu đề.
  const { data: discussionList } = useQuery({
    queryKey: ["report-target", "discussions"],
    queryFn: () => discussionService.listPosts({ page_size: 100 }),
    enabled: hasDiscussion,
    staleTime: 5 * 60_000,
  });

  const meta = new Map<string, ReportTargetMeta>();

  userIds.forEach((id, i) => {
    const u = userQueries[i]?.data;
    if (!u) return;
    meta.set(reportTargetKey("user", id), {
      name: u.full_name || u.user_name || u.email,
      href: `/admin/users/${id}`,
    });
  });

  courseIds.forEach((id, i) => {
    const c = courseQueries[i]?.data;
    if (!c) return;
    meta.set(reportTargetKey("course", id), {
      name: c.title,
      href: "/admin/courses",
    });
  });

  for (const post of discussionList?.posts ?? []) {
    meta.set(reportTargetKey("discussion", post.id), { name: post.title });
  }

  return meta;
}
