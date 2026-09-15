/**
 * Đích điều hướng của một hàng nội dung bài học — tách khỏi component để test được.
 *
 * Bối cảnh (Phase 0 review vòng 3, finding M-6): hàng nội dung type `livestream`
 * từng mở `/rooms/${content.id}` — đó là id **lesson_content**, còn
 * `(live)/rooms/[roomName]/page.tsx` coi `roomName` là id **phiên livestream**
 * (`POST /livestream/:id/join`). Hai id khác nhau nên join luôn hỏng và người
 * dùng nhận màn "Không thể tham gia buổi học trực tiếp này" — sai nguyên nhân.
 *
 * Nhánh đó trước đây là code chết (chưa từng có lesson_content type livestream);
 * M-1 làm nó sống dậy. Từ nay web chỉ mở phòng khi backend trả về
 * `livestream_session_id` thật (trường được thêm vào `LessonContentResponseDTO`
 * cùng đợt).
 *
 * KHÔNG bao giờ rơi về `content.id` khi thiếu `livestream_session_id`.
 */

/** Câu hiện ở tooltip khi hàng livestream chưa có phiên để mở. */
export const LIVESTREAM_NOT_READY_HINT = "Phiên live chưa sẵn sàng";

/**
 * Đường dẫn phòng học cho một hàng nội dung type `livestream`.
 *
 * @returns `/rooms/<id phiên livestream>`, hoặc `null` khi phiên chưa sẵn sàng
 *   (`livestream_session_id` là `null`/`undefined`/chuỗi rỗng — gồm cả trường
 *   hợp response cũ chưa có field). `null` nghĩa là hàng đó không bấm được.
 */
export function resolveLivestreamRoomHref(content: {
  /**
   * id của `lesson_content` — **cố tình không dùng**. Khai báo ở đây để chữ ký
   * hàm nói rõ nó không phải nguồn, và để test chốt được điều đó.
   */
  id?: string;
  livestream_session_id?: string | null;
}): string | null {
  const sessionId = content.livestream_session_id?.trim();
  return sessionId ? `/rooms/${sessionId}` : null;
}
