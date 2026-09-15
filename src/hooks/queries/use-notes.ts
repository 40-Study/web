/**
 * Ghi chú theo mốc thời gian (contract §3) — query + mutation.
 *
 * Hai chế độ xem dùng hai nguồn khác nhau đúng như contract:
 *  - "Trong chương hiện tại" → `GET /courses/:courseId/notes?section_id=`
 *  - "Tất cả"                → `GET /courses/:courseId/notes`
 * Panel ghi chú của MỘT bài thì dùng `GET /lessons/:lessonId/notes`.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  notesService,
  type CreateNoteDTO,
  type Note,
  type NoteSort,
  type UpdateNoteDTO,
} from "@/services/notes.service";

export const noteKeys = {
  all: ["notes"] as const,
  byLesson: (lessonId: string) => [...noteKeys.all, "lesson", lessonId] as const,
  byCourse: (courseId: string, sectionId?: string, sort?: NoteSort) =>
    [...noteKeys.all, "course", courseId, sectionId ?? "all", sort ?? "timestamp"] as const,
};

/** Ghi chú của một bài học. */
export function useLessonNotes(lessonId: string | undefined) {
  return useQuery({
    queryKey: noteKeys.byLesson(lessonId ?? ""),
    queryFn: () => notesService.listByLesson(lessonId!),
    enabled: !!lessonId,
  });
}

/** Ghi chú trong khoá, lọc theo chương khi `sectionId` được truyền. */
export function useCourseNotes(
  courseId: string | undefined,
  options?: { sectionId?: string; sort?: NoteSort }
) {
  return useQuery({
    queryKey: noteKeys.byCourse(courseId ?? "", options?.sectionId, options?.sort),
    queryFn: () =>
      notesService.listByCourse(courseId!, { section_id: options?.sectionId, sort: options?.sort }),
    enabled: !!courseId,
  });
}

/** Invalidate mọi danh sách ghi chú có thể chứa note vừa đổi. */
function useInvalidateNotes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: noteKeys.all });
}

export function useCreateNote(lessonId: string) {
  const invalidate = useInvalidateNotes();
  return useMutation({
    mutationFn: (data: CreateNoteDTO) => notesService.create(lessonId, data),
    onSuccess: () => {
      invalidate();
    },
    onError: () => {
      toast.error("Chưa lưu được ghi chú. Vui lòng thử lại.");
    },
  });
}

export function useUpdateNote() {
  const invalidate = useInvalidateNotes();
  return useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: UpdateNoteDTO }) =>
      notesService.update(noteId, data),
    onSuccess: () => {
      invalidate();
    },
    onError: () => {
      toast.error("Chưa sửa được ghi chú. Vui lòng thử lại.");
    },
  });
}

export function useDeleteNote() {
  const invalidate = useInvalidateNotes();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => notesService.remove(noteId),
    // Xoá lạc quan: chờ round-trip mới ẩn note thì người học tưởng nút hỏng.
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.all });
      const snapshot = queryClient.getQueriesData<Note[]>({ queryKey: noteKeys.all });
      for (const [key, notes] of snapshot) {
        if (!notes) continue;
        queryClient.setQueryData<Note[]>(
          key,
          notes.filter((note) => note.id !== noteId)
        );
      }
      return { snapshot };
    },
    onError: (_error, _noteId, context) => {
      for (const [key, notes] of context?.snapshot ?? []) {
        queryClient.setQueryData(key, notes);
      }
      toast.error("Chưa xoá được ghi chú. Vui lòng thử lại.");
    },
    onSettled: () => {
      invalidate();
    },
  });
}
