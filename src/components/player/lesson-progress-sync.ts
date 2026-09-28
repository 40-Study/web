import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { courseKeys } from "@/hooks/queries/use-courses";
import { sectionKeys } from "@/hooks/queries/use-sections";
import { enrollmentKeys } from "@/hooks/queries/use-enrollments";
import { certificateKeys } from "@/hooks/queries/use-certificates";

/**
 * Làm mới dữ liệu phụ thuộc tiến độ sau khi server chốt một bài (`completed`)
 * hoặc mở bài kế tiếp. Dùng chung cho bài video (heartbeat) và bài không có
 * video (nút "Đánh dấu hoàn thành") để hai đường không lệch nhau.
 */
export function invalidateAfterLessonProgress(queryClient: QueryClient, courseId?: string) {
  if (courseId) {
    void queryClient.invalidateQueries({ queryKey: sectionKeys.byCourse(courseId) });
  }
  void queryClient.invalidateQueries({ queryKey: courseKeys.enrolled() });
  // PlayerLessonSidebar đọc % tiến độ từ useMyEnrollments() (["enrollments"]).
  void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
}

/**
 * `course_completed` có trong response `PUT /lessons/:id/progress` (backend
 * LessonProgressStateDTO) nhưng type `LessonProgressResponse` ở
 * services/enrollment.service.ts (ngoài phạm vi lane A) chưa khai báo — đọc
 * qua kiểu hẹp ở đây cho tới khi type đó được bổ sung.
 */
export function isCourseCompleted(progress: object): boolean {
  return (progress as { course_completed?: unknown }).course_completed === true;
}

/**
 * Báo học viên đã hoàn thành khoá (A4, QA vòng 2). Chứng chỉ được server cấp
 * khi danh sách chứng chỉ được mở, nên chỉ cần dẫn tới trang đó.
 */
export function announceCourseCompleted(queryClient: QueryClient, goToCertificates: () => void) {
  void queryClient.invalidateQueries({ queryKey: certificateKeys.all });
  toast.success("Chúc mừng! Bạn đã hoàn thành khoá học.", {
    description: "Chứng chỉ của bạn đã sẵn sàng.",
    action: { label: "Xem chứng chỉ", onClick: goToCertificates },
    duration: 10_000,
  });
}
