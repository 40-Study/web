/**
 * Hồ sơ giảng viên công khai (PG-M2). Giảng viên không tồn tại / không hoạt động (404) và id sai định dạng (400)
 * đều là "không có trang này" -> `null` để trang gọi notFound(), thay vì in lỗi kỹ thuật như
 * "invalid UUID length"; lỗi mạng/máy chủ vẫn ném để trang hiện nút Thử lại.
 */

import { useQuery } from "@tanstack/react-query";
import { ApiError, NotFoundError } from "@/lib/errors";
import { teacherService, type PublicTeacherProfile } from "@/services/teacher.service";

export const teacherPublicKeys = {
  profile: (teacherId: string) => ["teachers", "public-profile", teacherId] as const,
};

export function useTeacherPublicProfile(teacherId: string) {
  return useQuery({
    queryKey: teacherPublicKeys.profile(teacherId),
    queryFn: async (): Promise<PublicTeacherProfile | null> => {
      try {
        return await teacherService.getPublicProfile(teacherId);
      } catch (error) {
        if (error instanceof NotFoundError || (error instanceof ApiError && error.status === 400)) return null;
        throw error;
      }
    },
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
  });
}
