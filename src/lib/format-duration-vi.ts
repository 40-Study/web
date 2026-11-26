/**
 * Khoảng thời gian bằng chữ tiếng Việt: 125 -> "2 phút 5 giây", 300 -> "5 phút", 45 -> "45 giây", 0 -> "0 giây".
 * Bỏ phần bằng 0 (trừ khi cả hai đều 0) để không hiện "5 phút 0 giây". Đầu vào âm/NaN/Infinity quy về 0.
 * Khác `formatStudyTime` (tổng giờ học dạng "1h 45m" cho thẻ thống kê học viên): đây là câu đọc được cho giảng viên.
 */
export function formatDurationVi(totalSeconds: number | null | undefined): string {
  const safe = typeof totalSeconds === "number" && Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  const parts: string[] = [];
  if (minutes > 0) parts.push(`${minutes} phút`);
  if (seconds > 0 || minutes === 0) parts.push(`${seconds} giây`);
  return parts.join(" ");
}
