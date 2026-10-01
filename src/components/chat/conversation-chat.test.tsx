/**
 * ConversationChat: tin mới về qua WebSocket hiện ngay không cần gọi lại API; mất WebSocket thì hiện
 * "Đang kết nối lại" và tự tải lại định kỳ; khi WS đang mở thì KHÔNG polling.
 */
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";
import { BusinessApiError } from "@/services/business-request";
import { toast } from "sonner";
import { renderWithQuery } from "@/test-utils/query-wrapper";
import { useAuthStore } from "@/stores/auth.store";
import type { ConversationSocketHandlers, ConversationSocketStatus } from "@/hooks/use-conversation-socket";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

// Điều khiển status và bắt handler mà component đăng ký, thay cho WebSocket thật.
const socket = vi.hoisted(() => ({
  status: "open" as ConversationSocketStatus,
  handlers: {} as ConversationSocketHandlers,
}));
vi.mock("@/hooks/use-conversation-socket", () => ({
  useConversationSocket: (_id: string, handlers: ConversationSocketHandlers) => {
    socket.handlers = handlers;
    return { status: socket.status };
  },
}));

import { conversationService, type Message } from "@/services/conversation.service";
import { CHAT_FALLBACK_POLL_MS, ConversationChat } from "./conversation-chat";

const msg = (id: string, content: string, sender = "u-other"): Message => ({
  id,
  conversation_id: "c1",
  sender_id: sender,
  sender_name: sender === "me" ? "Tôi" : "Lan",
  type: "TEXT",
  content,
  status: "SENT",
  is_edited: false,
  is_pinned: false,
  created_at: "2026-09-30T10:00:00Z",
});

describe("ConversationChat", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    socket.status = "open";
    vi.spyOn(conversationService, "markAsRead").mockResolvedValue({});
    // API trả tin mới nhất trước.
    vi.spyOn(conversationService, "getMessages").mockResolvedValue({
      messages: [msg("m2", "tin thứ hai"), msg("m1", "tin đầu tiên")],
      total_count: 2,
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("hiện tin theo thứ tự cũ -> mới", async () => {
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);

    await screen.findByText("tin thứ hai");
    const texts = screen.getAllByText(/^tin /).map((n) => n.textContent);
    expect(texts).toEqual(["tin đầu tiên", "tin thứ hai"]);
  });

  it("tin mới qua WebSocket hiện ngay, không gọi lại API", async () => {
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin thứ hai");
    expect(conversationService.getMessages).toHaveBeenCalledTimes(1);

    act(() => socket.handlers.onMessage?.(msg("m3", "tin realtime")));

    expect(await screen.findByText("tin realtime")).toBeTruthy();
    expect(conversationService.getMessages).toHaveBeenCalledTimes(1);
  });

  it("tin sửa và tin xoá qua WebSocket cập nhật khung chat", async () => {
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin thứ hai");

    act(() => socket.handlers.onEdited?.({ ...msg("m1", "tin đã sửa"), is_edited: true }));
    expect(await screen.findByText(/tin đã sửa/)).toBeTruthy();
    expect(screen.queryByText("tin đầu tiên")).toBeNull();

    act(() => socket.handlers.onDeleted?.({ message_id: "m2", conversation_id: "c1" }));
    await waitFor(() => expect(screen.queryByText("tin thứ hai")).toBeNull());
  });

  it("WebSocket đang mở: không có banner và KHÔNG polling", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin thứ hai");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CHAT_FALLBACK_POLL_MS * 3);
    });

    expect(screen.queryByText(/Đang kết nối lại/)).toBeNull();
    expect(conversationService.getMessages).toHaveBeenCalledTimes(1);
  });

  it("mất WebSocket: hiện 'Đang kết nối lại' và tự tải lại định kỳ", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    socket.status = "reconnecting";
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin thứ hai");

    expect(screen.getByRole("status").textContent).toMatch(/Đang kết nối lại/);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(CHAT_FALLBACK_POLL_MS + 500);
    });

    expect(vi.mocked(conversationService.getMessages).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("WebSocket không khả dụng (bị từ chối kênh / thiếu URL): vẫn polling, không hiện banner lừa", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    socket.status = "unavailable";
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin thứ hai");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CHAT_FALLBACK_POLL_MS + 500);
    });

    expect(screen.queryByText(/Đang kết nối lại/)).toBeNull();
    expect(vi.mocked(conversationService.getMessages).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("gửi tin: Enter gọi sendMessage với nội dung đã trim và xoá ô nhập", async () => {
    const send = vi.spyOn(conversationService, "sendMessage").mockResolvedValue(msg("m9", "xin chào", "me"));
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin thứ hai");

    const input = screen.getByLabelText("Nhập tin nhắn") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  xin chào  " } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(send).toHaveBeenCalledWith("c1", { content: "xin chào" }));
    expect(input.value).toBe("");
  });

  it("nút Gửi khoá khi ô nhập trống", async () => {
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin thứ hai");

    expect((screen.getByRole("button", { name: "Gửi tin nhắn" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("tải tin lỗi và chưa có gì để hiển thị: hiện lỗi + Thử lại, không phải khung trống", async () => {
    vi.spyOn(conversationService, "getMessages").mockRejectedValue(new ApiError(500, "UNKNOWN", "boom"));
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);

    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
    expect(screen.queryByText(/Chưa có tin nhắn nào/)).toBeNull();
  });

  it("hội thoại chưa có tin: gợi ý gửi lời chào", async () => {
    vi.spyOn(conversationService, "getMessages").mockResolvedValue({ messages: [], total_count: 0 });
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);

    expect(await screen.findByText(/Chưa có tin nhắn nào/)).toBeTruthy();
  });
});

describe("ConversationChat — DM bị chặn (ERR_CONVERSATION_BLOCKED)", () => {
  const BLOCKED_MESSAGE = "Không thể gửi tin nhắn trong cuộc trò chuyện này";
  const blocked = () => new BusinessApiError(403, "ERR_CONVERSATION_BLOCKED", BLOCKED_MESSAGE);

  beforeEach(() => {
    window.sessionStorage.clear();
    socket.status = "open";
    vi.spyOn(conversationService, "markAsRead").mockResolvedValue({});
    vi.spyOn(conversationService, "getMessages").mockResolvedValue({
      messages: [msg("m1", "lịch sử vẫn đọc được")],
      total_count: 1,
    });
  });

  const send = (text: string) => {
    const input = screen.getByLabelText("Nhập tin nhắn") as HTMLInputElement;
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: "Enter" });
  };

  it("403 khi gửi: báo đúng câu, khoá ô nhập + nút gửi, lịch sử vẫn hiện, chỉ gọi API một lần (không retry)", async () => {
    const spy = vi.spyOn(conversationService, "sendMessage").mockRejectedValue(blocked());
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("lịch sử vẫn đọc được");

    send("xin chào");

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(BLOCKED_MESSAGE);
    expect((screen.getByLabelText("Nhập tin nhắn") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Gửi tin nhắn" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("lịch sử vẫn đọc được")).toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);
    // Toast cũng dùng câu cố định, không phải "Không thể gửi tin nhắn" chung.
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(BLOCKED_MESSAGE);
  });

  it("chữ vừa gõ không bị mất khi bị chặn (trả lại bản nháp)", async () => {
    vi.spyOn(conversationService, "sendMessage").mockRejectedValue(blocked());
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("lịch sử vẫn đọc được");

    send("bản nháp quan trọng");

    await screen.findByRole("alert");
    expect((screen.getByLabelText("Nhập tin nhắn") as HTMLInputElement).value).toBe("bản nháp quan trọng");
  });

  it("bấm 'Thử lại' (sau khi bỏ chặn) mở khoá và gửi được", async () => {
    const spy = vi
      .spyOn(conversationService, "sendMessage")
      .mockRejectedValueOnce(blocked())
      .mockResolvedValueOnce(msg("m9", "đã gửi", "me"));
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("lịch sử vẫn đọc được");
    send("lần một");
    await screen.findByRole("alert");

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(screen.queryByRole("alert")).toBeNull();
    const input = screen.getByLabelText("Nhập tin nhắn") as HTMLInputElement;
    expect(input.disabled).toBe(false);
    send("lần hai");
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
  });

  it("lỗi khác (không phải bị chặn) KHÔNG khoá ô nhập: chat nhóm không bị ảnh hưởng", async () => {
    vi.spyOn(conversationService, "sendMessage").mockRejectedValue(new BusinessApiError(403, "ERR_FORBIDDEN", "x"));
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("lịch sử vẫn đọc được");

    send("tin nhóm");

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).toBeNull();
    expect((screen.getByLabelText("Nhập tin nhắn") as HTMLInputElement).disabled).toBe(false);
  });
});

// E2E 01/10 F2: ô nhập từng chỉ khoá SAU lần gửi đầu bị 403. Backend nay trả `is_blocked` trong chi tiết hội
// thoại DM, nên khung chat khoá ngay khi mở (không cần gửi thử).
describe("ConversationChat — DM bị chặn từ trước (cờ is_blocked của server)", () => {
  const BLOCKED_MESSAGE = "Không thể gửi tin nhắn trong cuộc trò chuyện này";
  const detail = (is_blocked?: boolean) =>
    ({ id: "c1", type: "DIRECT", message_count: 1, unread_count: 0, is_muted: false, is_pinned: false, participants: [], created_at: "", updated_at: "", is_blocked }) as Awaited<
      ReturnType<typeof conversationService.getById>
    >;
  const input = () => screen.getByLabelText("Nhập tin nhắn") as HTMLInputElement;
  const sendButton = () => screen.getByRole("button", { name: "Gửi tin nhắn" }) as HTMLButtonElement;

  beforeEach(() => {
    window.sessionStorage.clear();
    socket.status = "open";
    vi.spyOn(conversationService, "markAsRead").mockResolvedValue({});
    vi.spyOn(conversationService, "getMessages").mockResolvedValue({
      messages: [msg("m1", "lịch sử vẫn đọc được")],
      total_count: 1,
    });
  });

  it("is_blocked=true: khoá ô nhập + nút gửi ngay khi mở, hiện đúng câu, lịch sử vẫn đọc được, không cần gửi thử", async () => {
    vi.spyOn(conversationService, "getById").mockResolvedValue(detail(true));
    const send = vi.spyOn(conversationService, "sendMessage");
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" isDirect />);

    await screen.findByText("lịch sử vẫn đọc được");
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(BLOCKED_MESSAGE);
    expect(input().disabled).toBe(true);
    expect(sendButton().disabled).toBe(true);
    expect(send).not.toHaveBeenCalled();
  });

  it("is_blocked=false: ô nhập mở như thường, không có cảnh báo", async () => {
    vi.spyOn(conversationService, "getById").mockResolvedValue(detail(false));
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" isDirect />);

    await screen.findByText("lịch sử vẫn đọc được");
    await waitFor(() => expect(conversationService.getById).toHaveBeenCalledWith("c1"));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(input().disabled).toBe(false);
  });

  it("chat nhóm (không phải DM): không hỏi chi tiết hội thoại, ô nhập mở", async () => {
    const getById = vi.spyOn(conversationService, "getById").mockResolvedValue(detail(true));
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);

    await screen.findByText("lịch sử vẫn đọc được");
    expect(getById).not.toHaveBeenCalled();
    expect(input().disabled).toBe(false);
  });

  it("'Thử lại' khi server vẫn báo chặn: tải lại cờ và GIỮ khoá (không mở khoá giả)", async () => {
    const getById = vi.spyOn(conversationService, "getById").mockResolvedValue(detail(true));
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" isDirect />);
    await screen.findByRole("alert");

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    await waitFor(() => expect(getById.mock.calls.length).toBeGreaterThanOrEqual(2));
    expect(screen.getByRole("alert").textContent).toContain(BLOCKED_MESSAGE);
    expect(input().disabled).toBe(true);
  });

  it("khoá vì lần gửi bị 403 chỉ thuộc hội thoại đó: chuyển sang DM khác thì ô nhập mở lại", async () => {
    vi.spyOn(conversationService, "getById").mockResolvedValue(detail(false));
    vi.spyOn(conversationService, "sendMessage").mockRejectedValue(new BusinessApiError(403, "ERR_CONVERSATION_BLOCKED", BLOCKED_MESSAGE));
    const { rerender } = renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" isDirect />);
    await screen.findByText("lịch sử vẫn đọc được");
    fireEvent.change(input(), { target: { value: "xin chào" } });
    fireEvent.keyDown(input(), { key: "Enter" });
    await screen.findByRole("alert");
    expect(input().disabled).toBe(true);

    // Trang Tin nhắn dùng lại cùng một <ConversationChat> khi chọn hội thoại khác (không có key).
    rerender(<ConversationChat conversationId="c2" currentUserId="me" isDirect />);

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(input().disabled).toBe(false);
  });

  it("bỏ chặn rồi bấm 'Thử lại': tải lại thấy is_blocked=false thì mở khoá", async () => {
    vi.spyOn(conversationService, "getById").mockResolvedValueOnce(detail(true)).mockResolvedValue(detail(false));
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" isDirect />);
    await screen.findByRole("alert");

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(input().disabled).toBe(false);
  });
});

// L4: trên điện thoại khung chat chiếm cả màn hình; scrollIntoView mặc định (block "start") kéo CẢ TRANG
// xuống nên tiêu đề hội thoại + nút quay lại trôi dưới header cố định. "nearest" chỉ cuộn khung tin nhắn.
describe("ConversationChat — cuộn tới tin mới nhất", () => {
  it("chỉ cuộn khung tin nhắn, không kéo cả trang (block: nearest)", async () => {
    socket.status = "open";
    vi.spyOn(conversationService, "markAsRead").mockResolvedValue({});
    vi.spyOn(conversationService, "getMessages").mockResolvedValue({ messages: [msg("m1", "tin đầu tiên")], total_count: 1 });
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin đầu tiên");

    expect(scrollIntoView).toHaveBeenCalled();
    for (const [opts] of scrollIntoView.mock.calls) expect(opts).toMatchObject({ block: "nearest" });
  });
});
// L5-1: bản nháp theo conversation_id — quay lại danh sách (điện thoại) làm khung chat unmount, mở lại
// hội thoại không được mất chữ đang gõ dở.
describe("ConversationChat — bản nháp theo hội thoại", () => {
  const input = () => screen.getByLabelText("Nhập tin nhắn") as HTMLInputElement;
  const type = (text: string) => fireEvent.change(input(), { target: { value: text } });

  beforeEach(() => {
    window.sessionStorage.clear();
    socket.status = "open";
    vi.spyOn(conversationService, "markAsRead").mockResolvedValue({});
    vi.spyOn(conversationService, "getMessages").mockResolvedValue({ messages: [msg("m1", "tin đầu tiên")], total_count: 1 });
  });

  it("unmount rồi mở lại cùng hội thoại: nháp còn nguyên", async () => {
    const first = renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin đầu tiên");
    type("đang gõ dở");
    first.unmount();

    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin đầu tiên");
    expect(input().value).toBe("đang gõ dở");
  });

  it("nháp thuộc từng hội thoại: đổi sang hội thoại khác không mang chữ sang", async () => {
    const view = renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin đầu tiên");
    type("nháp của c1");

    view.rerender(<ConversationChat conversationId="c2" currentUserId="me" />);
    expect(input().value).toBe("");
    type("nháp của c2");

    view.rerender(<ConversationChat conversationId="c1" currentUserId="me" />);
    expect(input().value).toBe("nháp của c1");
  });

  it("gửi thành công thì xoá nháp: mở lại ô nhập rỗng", async () => {
    vi.spyOn(conversationService, "sendMessage").mockResolvedValue(msg("m9", "xin chào", "me"));
    const first = renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin đầu tiên");
    type("xin chào");
    fireEvent.keyDown(input(), { key: "Enter" });
    await waitFor(() => expect(conversationService.sendMessage).toHaveBeenCalled());
    await waitFor(() => expect(input().value).toBe(""));
    first.unmount();

    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin đầu tiên");
    expect(input().value).toBe("");
  });

  it("gửi lỗi thì trả lại nháp (không mất chữ) và vẫn giữ sau khi mở lại", async () => {
    vi.spyOn(conversationService, "sendMessage").mockRejectedValue(new Error("mạng"));
    const first = renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin đầu tiên");
    type("gửi hỏng");
    fireEvent.keyDown(input(), { key: "Enter" });
    await waitFor(() => expect(input().value).toBe("gửi hỏng"));
    first.unmount();

    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin đầu tiên");
    expect(input().value).toBe("gửi hỏng");
  });

  it("sessionStorage ném lỗi: khung chat vẫn gõ và gửi được, không crash", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(conversationService, "sendMessage").mockResolvedValue(msg("m9", "ok", "me"));
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" />);
    await screen.findByText("tin đầu tiên");

    type("vẫn gõ được");
    expect(input().value).toBe("vẫn gõ được");
    fireEvent.keyDown(input(), { key: "Enter" });
    await waitFor(() => expect(conversationService.sendMessage).toHaveBeenCalled());
    vi.restoreAllMocks();
  });
});

// L5 review MAJOR: sessionStorage sống theo TAB nên nháp của A không được lộ cho B đăng nhập sau trên cùng tab.
describe("ConversationChat — nháp không lộ giữa các tài khoản", () => {
  const input = () => screen.getByLabelText("Nhập tin nhắn") as HTMLInputElement;

  beforeEach(() => {
    window.sessionStorage.clear();
    socket.status = "open";
    vi.spyOn(conversationService, "markAsRead").mockResolvedValue({});
    vi.spyOn(conversationService, "getMessages").mockResolvedValue({ messages: [msg("m1", "tin đầu tiên")], total_count: 1 });
  });

  it("A gõ dở, đăng xuất, B mở cùng hội thoại: ô nhập của B rỗng", async () => {
    const a = renderWithQuery(<ConversationChat conversationId="dm-AB" currentUserId="userA" />);
    await screen.findByText("tin đầu tiên");
    fireEvent.change(input(), { target: { value: "bí mật của A" } });
    a.unmount();

    useAuthStore.getState().logout();

    renderWithQuery(<ConversationChat conversationId="dm-AB" currentUserId="userB" />);
    await screen.findByText("tin đầu tiên");
    expect(input().value).toBe("");
    expect(JSON.stringify({ ...window.sessionStorage })).not.toContain("bí mật của A");
  });

  it("khoá nháp gắn userId: B không thấy nháp của A kể cả khi không có đăng xuất nào", async () => {
    const a = renderWithQuery(<ConversationChat conversationId="dm-AB" currentUserId="userA" />);
    await screen.findByText("tin đầu tiên");
    fireEvent.change(input(), { target: { value: "bí mật của A" } });
    a.unmount();

    renderWithQuery(<ConversationChat conversationId="dm-AB" currentUserId="userB" />);
    await screen.findByText("tin đầu tiên");
    expect(input().value).toBe("");
  });

  it("mất phiên (clearServerSession) cũng xoá nháp", async () => {
    const a = renderWithQuery(<ConversationChat conversationId="dm-AB" currentUserId="userA" />);
    await screen.findByText("tin đầu tiên");
    fireEvent.change(input(), { target: { value: "dở dang" } });
    a.unmount();

    useAuthStore.getState().clearServerSession();

    renderWithQuery(<ConversationChat conversationId="dm-AB" currentUserId="userA" />);
    await screen.findByText("tin đầu tiên");
    expect(input().value).toBe("");
  });

  it("sessionStorage ném lỗi lúc đăng xuất: không crash", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => useAuthStore.getState().logout()).not.toThrow();
  });
});

// L3: chặn/bỏ chặn realtime (event `conversation_blocked_changed` qua kênh người dùng). Khung chat khoá hoặc mở ô
// nhập NGAY, không cần gửi thử và không cần tải lại.
describe("ConversationChat — chặn/bỏ chặn realtime (conversation_blocked_changed)", () => {
  const BLOCKED_MESSAGE = "Không thể gửi tin nhắn trong cuộc trò chuyện này";
  const detail = (is_blocked?: boolean) =>
    ({ id: "c1", type: "DIRECT", message_count: 1, unread_count: 0, is_muted: false, is_pinned: false, participants: [], created_at: "", updated_at: "", is_blocked }) as Awaited<
      ReturnType<typeof conversationService.getById>
    >;
  const input = () => screen.getByLabelText("Nhập tin nhắn") as HTMLInputElement;
  const sendButton = () => screen.getByRole("button", { name: "Gửi tin nhắn" }) as HTMLButtonElement;

  beforeEach(() => {
    socket.status = "open";
    vi.spyOn(conversationService, "markAsRead").mockResolvedValue({});
    vi.spyOn(conversationService, "getMessages").mockResolvedValue({
      messages: [msg("m1", "lịch sử vẫn đọc được")],
      total_count: 1,
    });
  });

  it("is_blocked=true tới khi đang mở DM: khoá ô nhập ngay, không gọi API gửi, không tải lại chi tiết", async () => {
    const getById = vi.spyOn(conversationService, "getById").mockResolvedValue(detail(false));
    const send = vi.spyOn(conversationService, "sendMessage");
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" isDirect />);
    await screen.findByText("lịch sử vẫn đọc được");
    await waitFor(() => expect(getById).toHaveBeenCalledTimes(1));
    expect(input().disabled).toBe(false);

    act(() => socket.handlers.onBlockedChanged?.({ conversation_id: "c1", is_blocked: true }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(BLOCKED_MESSAGE);
    expect(input().disabled).toBe(true);
    expect(sendButton().disabled).toBe(true);
    expect(send).not.toHaveBeenCalled();
    expect(getById).toHaveBeenCalledTimes(1);
  });

  it("is_blocked=false tới khi đang khoá (cờ server lúc mở): mở ô nhập ngay", async () => {
    vi.spyOn(conversationService, "getById").mockResolvedValue(detail(true));
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" isDirect />);
    await screen.findByRole("alert");
    expect(input().disabled).toBe(true);

    act(() => socket.handlers.onBlockedChanged?.({ conversation_id: "c1", is_blocked: false }));

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(input().disabled).toBe(false);
  });

  it("is_blocked=false cũng gỡ khoá do lần gửi bị 403 trước đó (không kẹt khoá sau khi hết chặn)", async () => {
    vi.spyOn(conversationService, "getById").mockResolvedValue(detail(false));
    vi.spyOn(conversationService, "sendMessage").mockRejectedValue(new BusinessApiError(403, "ERR_CONVERSATION_BLOCKED", BLOCKED_MESSAGE));
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" isDirect />);
    await screen.findByText("lịch sử vẫn đọc được");
    fireEvent.change(input(), { target: { value: "xin chào" } });
    fireEvent.keyDown(input(), { key: "Enter" });
    await screen.findByRole("alert");

    act(() => socket.handlers.onBlockedChanged?.({ conversation_id: "c1", is_blocked: false }));

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(input().disabled).toBe(false);
  });

  it("sự kiện của DM khác (cùng kênh người dùng) bị bỏ qua", async () => {
    vi.spyOn(conversationService, "getById").mockResolvedValue(detail(false));
    renderWithQuery(<ConversationChat conversationId="c1" currentUserId="me" isDirect />);
    await screen.findByText("lịch sử vẫn đọc được");

    act(() => socket.handlers.onBlockedChanged?.({ conversation_id: "c-khac", is_blocked: true }));

    expect(screen.queryByRole("alert")).toBeNull();
    expect(input().disabled).toBe(false);
  });
});