/**
 * M-6: hàng nội dung livestream phải mở ĐÚNG id phiên livestream, và không bấm
 * được khi phiên chưa sẵn sàng.
 *
 * Lỗi cũ: mở `/rooms/${content.id}` — id lesson_content, không phải id phiên, nên
 * join luôn hỏng.
 */

import { describe, expect, it } from "vitest";
import { LIVESTREAM_NOT_READY_HINT, resolveLivestreamRoomHref } from "./lesson-content-link";

describe("resolveLivestreamRoomHref", () => {
  it("có livestream_session_id → mở đúng phòng của phiên đó", () => {
    expect(resolveLivestreamRoomHref({ livestream_session_id: "session-9" })).toBe(
      "/rooms/session-9"
    );
  });

  it("KHÔNG bao giờ dùng id của lesson_content (M-6)", () => {
    // Hình dạng thật của dữ liệu: id phiên khác id nội dung.
    expect(resolveLivestreamRoomHref({ id: "content-1", livestream_session_id: "session-9" })).toBe(
      "/rooms/session-9"
    );
    // Chỉ có id nội dung, không có id phiên → không đoán, và tuyệt đối không
    // rơi về `/rooms/content-1` như trước.
    expect(resolveLivestreamRoomHref({ id: "content-1" })).toBeNull();
  });

  it("livestream_session_id null → null (không bấm được)", () => {
    expect(resolveLivestreamRoomHref({ livestream_session_id: null })).toBeNull();
  });

  it("thiếu hẳn field (response cũ) → null, không đoán bừa", () => {
    expect(resolveLivestreamRoomHref({})).toBeNull();
    expect(resolveLivestreamRoomHref({ livestream_session_id: undefined })).toBeNull();
  });

  it("chuỗi rỗng / khoảng trắng → null", () => {
    expect(resolveLivestreamRoomHref({ livestream_session_id: "" })).toBeNull();
    expect(resolveLivestreamRoomHref({ livestream_session_id: "   " })).toBeNull();
  });

  it("câu tooltip nói đúng trạng thái chờ phiên", () => {
    expect(LIVESTREAM_NOT_READY_HINT).toBe("Phiên live chưa sẵn sàng");
  });
});
