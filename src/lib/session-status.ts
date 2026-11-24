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

/** Buổi "scheduled" mà giờ hẹn đã qua (chưa ai mở phòng): không còn là "Đã lên lịch". */
export const SESSION_OVERDUE_LABEL = "Quá giờ, chưa diễn ra";

/**
 * Q4-T21: buổi "Live hỏi đáp" ngày 11/10 vẫn hiện "Đã lên lịch" sang tháng sau. Truyền `scheduledAt` để buổi đã
 * quá giờ mà backend vẫn để "scheduled" hiện đúng tình trạng.
 */
export function sessionStatusLabel(
  status: string | undefined | null,
  scheduledAt?: string | null,
  now: Date = new Date(),
): string {
  const effective = status || "scheduled";
  if (effective === "scheduled" && scheduledAt) {
    const at = new Date(scheduledAt).getTime();
    if (!Number.isNaN(at) && at < now.getTime()) return SESSION_OVERDUE_LABEL;
  }
  return SESSION_STATUS_LABELS[effective] ?? "Chưa rõ";
}
