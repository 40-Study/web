import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/livestream.service", () => ({
  livestreamService: {
    lockWhiteboard: vi.fn(),
    unlockWhiteboard: vi.fn(),
  },
}));

import { livestreamService } from "@/services/livestream.service";
import { applyWhiteboardLock } from "./whiteboard-lock";

afterEach(() => {
  vi.clearAllMocks();
});

/**
 * C1 (review vòng 2 web PR #18): phần kiến trúc quan trọng nhất của fix — kết
 * quả khoá/mở khoá đến từ REST THÀNH CÔNG, không đợi một gói LiveKit tự gửi
 * không bao giờ tới (LiveKit không echo gói tự gửi cho chính người gửi).
 */
describe("applyWhiteboardLock (C1)", () => {
  it("gọi lock-whiteboard và trả locked=true khi khoá thành công", async () => {
    (livestreamService.lockWhiteboard as ReturnType<typeof vi.fn>).mockResolvedValue({ message: "Whiteboard locked" });

    const result = await applyWhiteboardLock("s1", true);

    expect(livestreamService.lockWhiteboard).toHaveBeenCalledWith("s1");
    expect(livestreamService.unlockWhiteboard).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, locked: true });
  });

  it("gọi unlock-whiteboard và trả locked=false khi mở khoá thành công", async () => {
    (livestreamService.unlockWhiteboard as ReturnType<typeof vi.fn>).mockResolvedValue({ message: "Whiteboard unlocked" });

    const result = await applyWhiteboardLock("s1", false);

    expect(livestreamService.unlockWhiteboard).toHaveBeenCalledWith("s1");
    expect(livestreamService.lockWhiteboard).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, locked: false });
  });

  it("trả ok:false kèm lỗi gốc khi REST thất bại (vd 403 NOT_SESSION_HOST) — không tự đổi state", async () => {
    const err = new Error("403 forbidden");
    (livestreamService.lockWhiteboard as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    const result = await applyWhiteboardLock("s1", true);

    expect(result).toEqual({ ok: false, error: err });
  });
});
