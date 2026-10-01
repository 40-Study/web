/**
 * L5-2: đọc hội thoại xong thì badge chưa đọc ở DANH SÁCH hội thoại phải tắt ngay.
 * `unread_count` nằm trong `conversationKeys.list()`; trước đây onSuccess chỉ làm mới `unread()` (tổng),
 * nên quay lại danh sách vẫn thấy badge cũ.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { conversationService } from "@/services/conversation.service";
import { createTestQueryClient, createWrapper } from "@/test-utils/query-wrapper";
import { conversationKeys, useMarkAsRead } from "./use-conversations";

describe("useMarkAsRead", () => {
  it("làm mới cả tổng chưa đọc lẫn danh sách hội thoại sau khi đánh dấu đã đọc", async () => {
    vi.spyOn(conversationService, "markAsRead").mockResolvedValue({});
    const client = createTestQueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useMarkAsRead(), { wrapper: createWrapper(client) });
    result.current.mutate("c1");

    await waitFor(() => expect(invalidate).toHaveBeenCalled());
    const keys = invalidate.mock.calls.map((c) => JSON.stringify(c[0]?.queryKey));
    expect(keys).toContain(JSON.stringify(conversationKeys.unread()));
    expect(keys).toContain(JSON.stringify(conversationKeys.list()));
  });
});
