/**
 * Gửi / sửa / xoá tin phải giữ `code` của 403 ERR_CONVERSATION_BLOCKED (DM bị chặn). Dùng `api.post/put/delete`
 * trực tiếp thì interceptor đổi 403 thành ForbiddenError và mất mã — mà UI cần mã để khoá ô nhập.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", () => ({ api: { request: vi.fn(), get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

import { api } from "@/lib/api-client";
import { conversationService } from "./conversation.service";

const BLOCKED = { status: 403, data: { code: "ERR_CONVERSATION_BLOCKED", message: "Không thể gửi tin nhắn trong cuộc trò chuyện này" }, headers: {} };

describe("conversationService: DM bị chặn giữ code", () => {
  beforeEach(() => vi.mocked(api.request).mockReset());

  it.each([
    ["sendMessage", () => conversationService.sendMessage("c1", { content: "hi" }), "POST", "/conversations/c1/messages"],
    ["editMessage", () => conversationService.editMessage("c1", "m1", "sửa"), "PUT", "/conversations/c1/messages/m1"],
    ["deleteMessage", () => conversationService.deleteMessage("c1", "m1"), "DELETE", "/conversations/c1/messages/m1"],
  ])("%s: 403 ERR_CONVERSATION_BLOCKED -> lỗi mang code, đúng method/url", async (_name, call, method, url) => {
    vi.mocked(api.request).mockResolvedValue(BLOCKED as never);

    await expect(call()).rejects.toMatchObject({ status: 403, code: "ERR_CONVERSATION_BLOCKED" });

    expect(vi.mocked(api.request).mock.calls[0][0]).toMatchObject({ method, url });
  });

  it("sendMessage thành công trả message đã bóc phong bì", async () => {
    vi.mocked(api.request).mockResolvedValue({ status: 200, data: { message: "ok", data: { id: "m9" } }, headers: {} } as never);
    await expect(conversationService.sendMessage("c1", { content: "hi" })).resolves.toEqual({ id: "m9" });
  });
});