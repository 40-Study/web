/**
 * Nhãn thời lượng bài ở mục lục trình phát (QA-A-17, 10/11/2026).
 *
 * `duration_minutes` của curriculum do giảng viên nhập tay (vd 18 phút) nên có thể lệch hẳn video thật
 * (QA: mục lục "18:00" trong khi trình phát "0:05 / 0:05"). Với bài ĐANG XEM, trang biết số giây thật
 * (độ dài media đo được khi video nạp metadata, hoặc `duration` của lesson content) nên ưu tiên số đó;
 * bài khác chưa có số thật thì giữ ước lượng theo phút.
 */

/** 5 -> "0:05", 1080 -> "18:00", 3723 -> "1:02:03" — cùng kiểu với đồng hồ của trình phát. */
export function formatLessonClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function lessonDurationLabel(
  durationMinutes: number | null | undefined,
  actualSeconds?: number | null
): string {
  if (actualSeconds && Number.isFinite(actualSeconds) && actualSeconds > 0) {
    return formatLessonClock(actualSeconds);
  }
  return durationMinutes ? formatLessonClock(durationMinutes * 60) : "0:00";
}
