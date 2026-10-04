/**
 * L4: trang Tin nhắn trên điện thoại (< md). Trước đây danh sách (w-80) và khung chat xếp cạnh nhau
 * trong một hàng ở 390px nên khung chat bị bóp còn ~70px. Quy ước mới:
 * - chưa chọn hội thoại: chỉ hiện danh sách;
 * - đã chọn: chỉ hiện khung chat + nút quay lại;
 * - từ md trở lên: luôn hai cột như cũ.
 *
 * jsdom không chạy CSS (vitest `css: false`) nên test kiểm class Tailwind quyết định hiển thị:
 * `hidden` (ẩn dưới md) đi kèm `md:flex` (hiện lại từ md).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: () => ({ user: { id: "u1" }, activeRole: "STUDENT" }),
}));
vi.mock("@/hooks/queries/use-conversations", () => ({
  useConversations: () => ({
    data: {
      conversations: [
        {
          id: "c1",
          type: "DIRECT",
          name: null,
          unread_count: 0,
          last_message: null,
          last_message_at: null,
          participants: [
            { user_id: "u1", user_name: "Tôi" },
            { user_id: "u2", user_name: "Cô Lan", is_online: false },
          ],
        },
      ],
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/components/chat/conversation-chat", () => ({
  ConversationChat: ({ conversationId }: { conversationId: string }) => (
    <div data-testid="chat-body">chat {conversationId}</div>
  ),
}));
vi.mock("./new-conversation-dialog", () => ({ NewConversationDialog: () => null }));

// Mô phỏng router của Next: `routerQuery` là query mà router báo (khi điều hướng phía client nó đổi TRƯỚC khi
// `window.location` đổi). null = chưa có router điều hướng, đọc từ URL trình duyệt như lúc tải thẳng trang.
const routerState = vi.hoisted(() => ({ query: null as string | null }));
vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams(routerState.query ?? (typeof window === "undefined" ? "" : window.location.search)),
}));

// eslint-disable-next-line import/first
import MessagesPage from "./page";

const hiddenBelowMd = (el: HTMLElement) => el.classList.contains("hidden") && el.classList.contains("md:flex");

describe("Trang Tin nhắn — bố cục điện thoại", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/messages");
  });
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("chưa chọn hội thoại: danh sách hiện, khung chat ẩn dưới md", () => {
    render(<MessagesPage />);
    expect(hiddenBelowMd(screen.getByTestId("conversation-list-panel"))).toBe(false);
    expect(hiddenBelowMd(screen.getByTestId("conversation-chat-panel"))).toBe(true);
    expect(screen.queryByRole("button", { name: /Quay lại danh sách/ })).toBeNull();
  });

  it("đã chọn hội thoại: danh sách ẩn dưới md, khung chat hiện kèm nút quay lại chỉ có ở điện thoại", () => {
    render(<MessagesPage />);
    fireEvent.click(screen.getByText("Cô Lan"));

    expect(hiddenBelowMd(screen.getByTestId("conversation-list-panel"))).toBe(true);
    expect(hiddenBelowMd(screen.getByTestId("conversation-chat-panel"))).toBe(false);
    expect(screen.getByTestId("chat-body").textContent).toBe("chat c1");
    const back = screen.getByRole("button", { name: /Quay lại danh sách/ });
    expect(back.classList.contains("md:hidden")).toBe(true);
  });

  it("nút quay lại trả về danh sách và bỏ ?conversation khỏi URL để tải lại không mở lại khung chat", () => {
    window.history.replaceState(null, "", "/messages?conversation=c1");
    render(<MessagesPage />);
    // deep-link: mở thẳng hội thoại, không phải bấm vào danh sách
    expect(screen.getByTestId("chat-body").textContent).toBe("chat c1");
    expect(hiddenBelowMd(screen.getByTestId("conversation-list-panel"))).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /Quay lại danh sách/ }));

    expect(hiddenBelowMd(screen.getByTestId("conversation-list-panel"))).toBe(false);
    expect(hiddenBelowMd(screen.getByTestId("conversation-chat-panel"))).toBe(true);
    expect(screen.queryByTestId("chat-body")).toBeNull();
    expect(window.location.search).toBe("");
  });
});

// L5-3, L5-4
describe("Trang Tin nhắn — deep-link và chiều cao", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/messages");
  });
  afterEach(() => {
    window.history.replaceState(null, "", "/");
    routerState.query = null;
  });

  it("điều hướng phía client (router.push): query của router mở khung chat dù window.location còn là URL cũ", () => {
    // Đúng tình huống bấm "Nhắn giảng viên": trang mount khi window.location chưa có ?conversation=.
    routerState.query = "conversation=c1";
    render(<MessagesPage />);
    expect(window.location.search).toBe("");
    expect(screen.getByTestId("chat-body").textContent).toBe("chat c1");
    expect(hiddenBelowMd(screen.getByTestId("conversation-list-panel"))).toBe(true);
  });

  it("đang ở /messages rồi query đổi sang ?conversation=<id> thì mở hội thoại đó", () => {
    routerState.query = "";
    const { rerender } = render(<MessagesPage />);
    expect(screen.queryByTestId("chat-body")).toBeNull();
    routerState.query = "conversation=c1";
    rerender(<MessagesPage />);
    expect(screen.getByTestId("chat-body").textContent).toBe("chat c1");
  });

  it("deep-link ?conversation=<id>: LẦN RENDER ĐẦU đã là khung chat (không nháy danh sách)", () => {
    window.history.replaceState(null, "", "/messages?conversation=c1");
    // renderToString không chạy effect: chỉ thấy khung chat nếu trạng thái được quyết định ngay khi render.
    const html = renderToString(<MessagesPage />);
    expect(html).toContain('data-testid="chat-body"');
    expect(html).toMatch(/data-testid="conversation-list-panel"[^>]*class="[^"]*\bhidden md:flex\b/);
  });

  it("không có ?conversation: render đầu hiện danh sách như cũ", () => {
    const html = renderToString(<MessagesPage />);
    expect(html).not.toContain('data-testid="chat-body"');
  });

  it("chiều cao khung: trừ chỗ thanh điều hướng dưới (lg:hidden) tới hết lg, chỉ trả lại từ lg trở lên", () => {
    const { container } = render(<MessagesPage />);
    const card = screen.getByTestId("conversation-list-panel").parentElement as HTMLElement;
    const cls = card.className;
    expect(container.contains(card)).toBe(true);
    // Thanh dưới ẩn ở `lg`, nên bước nhảy chiều cao phải ở `lg`, không phải `md`.
    expect(cls).toContain("h-[calc(100dvh-250px)]");
    expect(cls).toContain("lg:h-[calc(100dvh-200px)]");
    expect(cls).not.toMatch(/\bmd:h-/);
  });
});
