import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMarkConversationRead } from "./use-mark-conversation-read";

describe("useMarkConversationRead", () => {
  it("marks each newly selected conversation exactly once", () => {
    const markAsRead = vi.fn();
    const { rerender } = renderHook(
      ({ conversationId }) => useMarkConversationRead(conversationId, markAsRead),
      { initialProps: { conversationId: null as string | null } }
    );

    rerender({ conversationId: "conversation-1" });
    rerender({ conversationId: "conversation-1" });
    rerender({ conversationId: "conversation-2" });

    expect(markAsRead).toHaveBeenCalledTimes(2);
    expect(markAsRead).toHaveBeenNthCalledWith(1, "conversation-1");
    expect(markAsRead).toHaveBeenNthCalledWith(2, "conversation-2");
  });
});
