/** Rời nhóm làm mới cả danh sách hội thoại; reaction/ghim bị ERR_CONVERSATION_BLOCKED hiện câu cố định. */
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

import { toast } from "sonner";
import { BusinessApiError } from "@/services/business-request";
import { groupService } from "@/services/group.service";
import { conversationService } from "@/services/conversation.service";
import { conversationKeys, useAddReaction } from "./use-conversations";
import { useLeaveGroup } from "./use-groups";

const setup = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
  return { client, wrapper };
};

describe("useLeaveGroup", () => {
  it("invalidate conversationKeys.list() cùng groupKeys", async () => {
    vi.spyOn(groupService, "leave").mockResolvedValue({});
    const { client, wrapper } = setup();
    const spy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useLeaveGroup(), { wrapper });

    act(() => result.current.mutate("g1"));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith({ queryKey: conversationKeys.list() });
  });
});

describe("useAddReaction — DM bị chặn", () => {
  it("403 ERR_CONVERSATION_BLOCKED -> toast câu cố định", async () => {
    vi.spyOn(conversationService, "addReaction").mockRejectedValue(
      new BusinessApiError(403, "ERR_CONVERSATION_BLOCKED", "x")
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useAddReaction("c1"), { wrapper });

    act(() => result.current.mutate({ messageId: "m1", emoji: "👍" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Không thể gửi tin nhắn trong cuộc trò chuyện này"));
  });
});