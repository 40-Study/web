import { describe, expect, it } from "vitest";
import { shouldDiscardWhiteboardEvent } from "./whiteboard-gate";

// R2-I3 (re-review vòng 2 PR #18 lần 2): đổi tên describe/test — hàm gate
// này KHÔNG phải nguồn của bug C1 (C1 là `whiteboardLocked` ở RoomClient
// không bao giờ cập nhật cho chính host, tức lỗi ở NGUỒN DỮ LIỆU nạp vào
// gate, xem session-settings.ts/whiteboard-lock.ts) — bản thân hàm thuần này
// luôn đúng nếu tham số đúng. Gắn đúng theo I1 (bộ lọc bảo vệ client trung
// thực, không phải kiểm soát an ninh — JSDoc đã sửa ở whiteboard-gate.ts).
describe("shouldDiscardWhiteboardEvent (I1, review vòng 2 web PR #18)", () => {
  it("giữ mọi nét vẽ khi bảng không khoá, bất kể ai gửi", () => {
    expect(
      shouldDiscardWhiteboardEvent({ senderIdentity: "student-1", hostId: "host-1", whiteboardLocked: false })
    ).toBe(false);
  });

  it("bỏ nét vẽ của học sinh khi bảng đang khoá", () => {
    expect(
      shouldDiscardWhiteboardEvent({ senderIdentity: "student-1", hostId: "host-1", whiteboardLocked: true })
    ).toBe(true);
  });

  it("giữ nét vẽ của host khi bảng đang khoá — host không tự chặn mình", () => {
    expect(
      shouldDiscardWhiteboardEvent({ senderIdentity: "host-1", hostId: "host-1", whiteboardLocked: true })
    ).toBe(false);
  });

  it("bỏ mọi nét vẽ khi hostId chưa xác định và bảng khoá (I3 — fail closed khi chưa biết host)", () => {
    expect(
      shouldDiscardWhiteboardEvent({ senderIdentity: "someone", hostId: null, whiteboardLocked: true })
    ).toBe(true);
    expect(
      shouldDiscardWhiteboardEvent({ senderIdentity: "someone", hostId: undefined, whiteboardLocked: true })
    ).toBe(true);
  });

  it("gate là hàm thuần — không phụ thuộc thứ tự/việc đã nhận gói LiveKit nào, chỉ cần đúng 3 tham số tại thời điểm gọi", () => {
    // Bug C1 nằm ở NGUỒN nạp `whiteboardLocked` (RoomClient chỉ đổi khi NHẬN
    // được gói LiveKit — không bao giờ xảy ra với chính host tự gửi), không
    // nằm ở hàm gate này. Bài test này khẳng định gate không có giả định ẩn
    // nào về thứ tự nhận gói — nó luôn đúng nếu đầu vào đúng; xem
    // `session-settings.test.ts`/`whiteboard-lock.test.ts` cho phần thật sự
    // sửa C1.
    expect(
      shouldDiscardWhiteboardEvent({ senderIdentity: "host-1", hostId: "host-1", whiteboardLocked: false })
    ).toBe(false);
  });
});
