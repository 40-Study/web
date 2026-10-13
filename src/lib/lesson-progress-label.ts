/**
 * Nhãn tiến độ bài học dùng chung (F-11, QA2 261013): trang chủ ghi "Bài 6/9" (số thứ tự bài đang học) còn
 * Khoá học của tôi ghi "5/9 bài học" (số bài đã xong) cho cùng một khoá -> người học tưởng tiến độ lệch.
 * Mọi nơi hiển thị tiến độ đều đi qua đây, với `completedLessons` lấy từ API (không suy từ phần trăm).
 */
export function formatLessonProgress(completed: number, total: number): string {
  const safeTotal = Math.max(0, total);
  const safeCompleted = Math.min(Math.max(0, completed), safeTotal);
  return `${safeCompleted}/${safeTotal} bài học`;
}
