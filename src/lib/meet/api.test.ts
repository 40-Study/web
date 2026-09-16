import { afterEach, describe, expect, it, vi } from "vitest";
import { api, MeetApiError } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * I4 (review vòng 2 web PR #18): reviewer đã chứng minh bằng mutation — vô
 * hiệu hoá việc đọc `body.message` ở `request()`/`upload()` (thay bằng
 * `undefined`) mà 133 test vẫn xanh, tức KHÔNG có test nào phủ cơ chế mã 403.
 * Test này lấp đúng lỗ đó: `.code` phải đọc từ `message` của envelope
 * `{message, error}` mà backend trả cho nhóm livestream/chat/whiteboard
 * (issue #58 review vòng 2, §7.4), còn `.message` (property Error chuẩn) vẫn
 * ưu tiên `error.error` để không đổi UX chỗ khác.
 */
describe("MeetApiError (I4)", () => {
  it("tách .code từ message của envelope 403, giữ .message = error gốc", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: "WHITEBOARD_LOCKED", error: "forbidden: whiteboard is locked" }),
      })
    );

    await expect(api.get("/whiteboard/x/snapshot")).rejects.toMatchObject({
      status: 403,
      code: "WHITEBOARD_LOCKED",
      message: "forbidden: whiteboard is locked",
    });
  });

  it("không có .code khi lỗi không phải nhóm 403 uy quyền (message rỗng)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "internal error" }),
      })
    );

    await expect(api.get("/whatever")).rejects.toMatchObject({
      status: 500,
      code: undefined,
      message: "internal error",
    });
  });

  it("body không parse được JSON vẫn ném MeetApiError thay vì throw thô", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("not json");
        },
      })
    );

    await expect(api.get("/whatever")).rejects.toBeInstanceOf(MeetApiError);
    await expect(api.get("/whatever")).rejects.toMatchObject({ message: "Unknown error" });
  });

  it("upload() cũng tách .code từ envelope giống request() (mutation ×2, dòng 43 và 65)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: "NOT_SESSION_MEMBER", error: "forbidden: not a session member" }),
      })
    );

    await expect(api.upload("/whiteboard/x/snapshot", new FormData())).rejects.toMatchObject({
      status: 403,
      code: "NOT_SESSION_MEMBER",
    });
  });
});
