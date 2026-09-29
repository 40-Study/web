/**
 * Nội dung bài "Xem thử" (is_preview) của khoá đã xuất bản — endpoint CÔNG KHAI, khách chưa đăng
 * nhập gọi được (F1, QA vòng 2).
 *
 * Trước đây trang chi tiết khoá dùng `useLessonContents` → `GET /lessons/:id/contents`, route đó
 * luôn yêu cầu đăng nhập nên khách nhận 401 và syllabus hiện "Chưa có nội dung" cho cả bài xem thử.
 * Backend nay có `GET /courses/:slug/preview-lessons/:lessonId/contents` (chỉ trả khi khoá
 * published VÀ bài is_preview; ngược lại 404).
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { LessonContent } from "@/services/lesson-content.service";

export const previewLessonContentKeys = {
  contents: (courseSlug: string, lessonId: string) =>
    ["lesson-content", "preview", courseSlug, lessonId] as const,
};

export function getPreviewLessonContentsPath(courseSlug: string, lessonId: string): string {
  return `/courses/${encodeURIComponent(courseSlug)}/preview-lessons/${lessonId}/contents`;
}

export function usePreviewLessonContents(
  courseSlug: string | undefined,
  lessonId: string,
  enabled = true
) {
  return useQuery({
    queryKey: previewLessonContentKeys.contents(courseSlug ?? "", lessonId),
    queryFn: () =>
      api
        .get<{ message: string; data: LessonContent[] }>(
          getPreviewLessonContentsPath(courseSlug as string, lessonId)
        )
        .then((r) => r.data.data),
    enabled: enabled && !!courseSlug && !!lessonId,
    staleTime: 30 * 1000,
    // 404 nghĩa là "không xem thử được" (khoá chưa published/bài không phải preview) — thử lại vô
    // ích và làm chậm hiện thông báo.
    retry: false,
  });
}
