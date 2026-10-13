/**
 * Nhân bản một bài trắc nghiệm trong bài học (QA2 Q2-03).
 *
 * `POST /quizzes/:id/duplicate` chỉ chép quiz + câu hỏi; bản sao chỉ hiện trong bài học khi có hàng
 * lesson_content type `quiz` trỏ tới nó. Hai bước này không nguyên tử ở backend, nên nếu bước tạo content
 * lỗi thì xoá bản sao vừa tạo (cùng cách nhánh "thêm quiz" của trang giảng viên dùng `undoStack`) để bấm
 * lại không để lại quiz mồ côi.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-messages";
import { lessonContentService } from "@/services/lesson-content.service";
import { quizService } from "@/services/quiz.service";
import { lessonContentKeys } from "@/hooks/queries/use-lesson-content";

export function useDuplicateQuizContent(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ quizId, isMandatory }: { quizId: string; isMandatory: boolean }) => {
      const copy = await quizService.duplicate(quizId);
      try {
        return await lessonContentService.createContent(lessonId, {
          type: "quiz",
          title: copy.title,
          quiz_id: copy.id,
          // Bản sao giữ tính bắt buộc của nội dung gốc (review QA2 #8), không ép về bắt buộc.
          is_mandatory: isMandatory,
        });
      } catch (err) {
        // Dọn bản sao; lỗi dọn không được che lỗi gốc nhưng cũng không được nuốt im lặng.
        await quizService.delete(copy.id).catch((cleanupErr: unknown) => {
          console.error("Không xoá được bản sao quiz sau khi tạo nội dung lỗi", cleanupErr);
        });
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonContentKeys.contents(lessonId) });
      toast.success("Đã nhân bản bài trắc nghiệm");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Không thể nhân bản bài trắc nghiệm")),
  });
}
