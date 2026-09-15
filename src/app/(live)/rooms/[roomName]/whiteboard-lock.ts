import { livestreamService } from "@/services/livestream.service";

/**
 * Áp trạng thái khoá bảng qua REST `lock-whiteboard`/`unlock-whiteboard` (C1,
 * review vòng 2 web PR #18). Trước đây `RoomClient` chỉ cập nhật trạng thái
 * khi NHẬN được gói LiveKit `whiteboard_control` — nhưng LiveKit không echo
 * gói tự gửi cho chính người gửi, nên trên máy host trạng thái không bao giờ
 * đổi và gate ở `VideoTab` vứt bỏ mọi nét vẽ của học sinh. Tách hàm thuần này
 * để test được mà không cần dựng toàn bộ RoomClient/LiveKit.
 *
 * Backend CHỈ trả `{message}` cho hai endpoint này — không có field trạng
 * thái trong body (`internal/handler/livestream_handler.go:405-440`) — nên
 * request thành công (không throw) nghĩa là server đã áp đúng giá trị
 * `locked` vừa gửi; hàm trả thẳng lại `locked` đó thay vì cố đọc field không
 * tồn tại từ response.
 */
export type WhiteboardLockResult =
  | { ok: true; locked: boolean }
  | { ok: false; error: unknown };

export async function applyWhiteboardLock(
  sessionId: string,
  locked: boolean
): Promise<WhiteboardLockResult> {
  try {
    if (locked) {
      await livestreamService.lockWhiteboard(sessionId);
    } else {
      await livestreamService.unlockWhiteboard(sessionId);
    }
    return { ok: true, locked };
  } catch (error) {
    return { ok: false, error };
  }
}
