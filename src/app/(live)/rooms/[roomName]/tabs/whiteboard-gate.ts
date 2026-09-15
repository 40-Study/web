/**
 * Có nên bỏ qua một sự kiện bảng vẽ (`whiteboard_event`/`whiteboard_control`)
 * nhận qua LiveKit data channel hay không.
 *
 * Đây là bộ lọc Ở PHÍA NGƯỜI NHẬN, bảo vệ CLIENT TRUNG THỰC — KHÔNG phải kiểm
 * soát an ninh (I1, review vòng 2 web PR #18: comment cũ nói quá là "chặn
 * participant giả mạo publishData thẳng qua LiveKit"). Một client độc hại
 * hoàn toàn có thể bỏ qua bộ lọc này ở máy của chính nó rồi publishData thẳng
 * — hàm này chỉ giúp CÁC CLIENT KHÁC không hiển thị nét vẽ trái phép trên UI
 * của họ. An ninh thật nằm ở backend: `SaveSnapshot` từ chối 403
 * `WHITEBOARD_LOCKED` khi `session.Settings.WhiteboardLocked=true`
 * (`whiteboard_service.go`).
 *
 * `whiteboardLocked` PHẢI đến từ trạng thái server (C1) — không phải suy từ
 * việc đã NHẬN được gói LiveKit nào đó, vì LiveKit không echo lại gói tự gửi
 * cho chính người gửi (khiến host tự khoá vĩnh viễn client của chính mình ở
 * bản trước).
 */
export function shouldDiscardWhiteboardEvent(params: {
  senderIdentity: string | undefined;
  hostId: string | null | undefined;
  whiteboardLocked: boolean | undefined;
}): boolean {
  // Danh tính THẬT của người gửi (LiveKit `participant.identity`, không thể
  // giả mạo từ payload) so với `hostId`. `hostId` chưa xác định (null/undefined,
  // kể cả khi fetch lỗi — I3) coi như "không phải host", tức khi bảng đang
  // khoá thì mọi sự kiện đều bị bỏ — an toàn hơn là mặc định cho qua.
  const senderIsHost = !!params.hostId && params.senderIdentity === params.hostId;
  return !!params.whiteboardLocked && !senderIsHost;
}
