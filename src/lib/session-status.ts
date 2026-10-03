/**
 * Nhãn tiếng Việt cho trạng thái buổi học trực tiếp (backend trả mã tiếng Anh: scheduled/live/ended/cancelled).
 * Mã lạ KHÔNG bị in thô ra giao diện mà rơi về "Chưa rõ" (B-17).
 */

const SESSION_STATUS_LABELS: Record<string, string> = {
  scheduled: "Đã lên lịch",
  live: "Đang diễn ra",
  ended: "Đã kết thúc",
  cancelled: "Đã huỷ",
};

export function sessionStatusLabel(status: string | undefined | null): string {
  if (!status) return SESSION_STATUS_LABELS.scheduled;
  return SESSION_STATUS_LABELS[status] ?? "Chưa rõ";
}
