import type { LeaderboardEntryDTO } from "@/services/leaderboard.service";

/** Nhãn backend gửi (display_name) cho người đặt "ẩn danh"; dùng làm dự phòng khi thiếu mọi trường tên. */
export const ANONYMOUS_LEARNER_LABEL = "Học viên ẩn danh";

/**
 * Tên nên hiển thị cho một dòng bảng xếp hạng. Backend đã áp cài đặt riêng tư `leaderboard_display` và trả sẵn
 * `display_name`; chỉ lùi về full_name/user_name cho phản hồi cũ chưa có field đó.
 */
export function leaderboardEntryName(entry: Pick<LeaderboardEntryDTO, "display_name" | "full_name" | "user_name">): string {
  return entry.display_name || entry.full_name || entry.user_name || ANONYMOUS_LEARNER_LABEL;
}

/**
 * Khoá React ổn định cho một dòng. Người ẩn danh KHÔNG có user_id (id dẫn tới hồ sơ nên backend không gửi), và
 * hạng có thể trùng khi đồng điểm, nên dùng thêm vị trí trong danh sách.
 */
export function leaderboardEntryKey(entry: Pick<LeaderboardEntryDTO, "user_id">, index: number): string {
  return entry.user_id ?? `anonymous-${index}`;
}