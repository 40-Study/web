/**
 * Chọn bài để "Tiếp tục học" cho một khoá: bài đầu tiên CHƯA hoàn thành và CHƯA bị khoá, theo
 * đúng thứ tự chương/bài. Khoá đã học xong hết thì mở lại từ bài đầu để ôn.
 *
 * A-11 (QA hồi quy 03/10): trước đây route `/courses/[slug]/learn` luôn redirect tới bài đầu tiên,
 * nên nút "Tiếp tục học ngay" của khoá đang học 5/9 bài lại mở "Bài 1.0" đã xong.
 *
 * `progress` và `locked` do server quyết định (contract §1/§2) và đã nằm trong dữ liệu bài học;
 * hàm này không tự suy ra gì ở client.
 */
interface ResumableLesson {
  id: string;
  locked?: boolean;
  progress?: { status?: string } | null;
}

interface ResumableSection {
  lessons: ResumableLesson[];
}

export function pickResumeLessonId(sections: ResumableSection[]): string | undefined {
  const lessons = sections.flatMap((s) => s.lessons ?? []);
  const next = lessons.find((l) => l.progress?.status !== "completed" && l.locked !== true);
  return (next ?? lessons[0])?.id;
}
