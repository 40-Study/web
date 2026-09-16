/**
 * Đọc `settings` từ response `GET /livestream/:id` (R2-C1, re-review vòng 2
 * PR #18 lần 2). Backend trả field này là một CHUỖI JSON đã `json.Marshal`
 * (`dto.LivestreamResponseDTO.Settings string` —
 * `internal/dto/livestreamDTO.go:67`; gán ở
 * `internal/service/livestream_service.go:994,1017`:
 * `settingsJSON, _ := json.Marshal(session.Settings); Settings: string(settingsJSON)`),
 * KHÔNG phải một object lồng như code trước đây giả định
 * (`res?.data?.settings?.whiteboard_locked` luôn `undefined` trên field kiểu
 * string — bug im lặng: seed lúc nào cũng rơi về mặc định `false`, không đọc
 * được trạng thái khoá bảng thật khi vào phòng).
 *
 * Chấp nhận CẢ HAI dạng (chuỗi JSON hoặc object đã parse sẵn) để an toàn nếu
 * backend đổi shape sau này mà không cần sửa lại chỗ gọi.
 *
 * Parse lỗi (chuỗi hỏng, không phải JSON hợp lệ) => FAIL-CLOSED:
 * `whiteboardLocked: true` — không xác định được trạng thái thật thì coi như
 * đang khoá (an toàn hơn mặc định mở, nhất quán với cách `shouldDiscardWhiteboardEvent`
 * xử lý "chưa biết host").
 */
export interface SessionSettings {
  whiteboardLocked: boolean;
}

function extractWhiteboardLocked(obj: unknown): boolean {
  if (obj && typeof obj === "object" && "whiteboard_locked" in obj) {
    return (obj as { whiteboard_locked?: unknown }).whiteboard_locked === true;
  }
  return false;
}

export function parseSessionSettings(settings: unknown): SessionSettings {
  if (settings && typeof settings === "object") {
    return { whiteboardLocked: extractWhiteboardLocked(settings) };
  }

  if (typeof settings === "string") {
    try {
      const parsed = JSON.parse(settings);
      if (parsed && typeof parsed === "object") {
        return { whiteboardLocked: extractWhiteboardLocked(parsed) };
      }
      // Parse ra một giá trị hợp lệ nhưng không phải object (vd number, "true")
      // — không đọc được field, coi như lỗi, fail-closed.
      return { whiteboardLocked: true };
    } catch {
      return { whiteboardLocked: true };
    }
  }

  // undefined/null/kiểu khác — không xác định được, fail-closed.
  return { whiteboardLocked: true };
}
