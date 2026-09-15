import { describe, expect, it } from "vitest";
import { shouldDiscardWhiteboardEvent } from "./whiteboard-gate";

describe("shouldDiscardWhiteboardEvent (C1, review vòng 2 web PR #18)", () => {
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

  it("C1 — hàm gate tự nó KHÔNG phụ thuộc việc đã nhận gói LiveKit nào: host tự gửi khi vừa mở khoá vẫn được giữ", () => {
    // Trước khi sửa, `whiteboardLocked` ở RoomClient chỉ đổi khi NHẬN được gói
    // LiveKit (không bao giờ xảy ra với chính người gửi) nên trên máy host nó
    // luôn true. Bài test này khẳng định gate chỉ cần đúng 3 tham số tại thời
    // điểm gọi, không có giả định ẩn nào về thứ tự nhận gói.
    expect(
      shouldDiscardWhiteboardEvent({ senderIdentity: "host-1", hostId: "host-1", whiteboardLocked: false })
    ).toBe(false);
  });
});
