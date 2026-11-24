/**
 * QA4 S5 + review #124: xoá bài gốc không được GET lại bài vừa xoá (404) khi trang chi tiết còn gắn query;
 * xoá bình luận thì làm mới chi tiết; lỗi xoá không có toast mặc định của app (trang tự toast một lần).
 * Dùng client có mặc định của app để thấy được toast mặc định.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import { ApiError } from "@/lib/errors";
import { createAppQueryClient } from "@/lib/query-client";

const getPostBySlug = vi.fn();
const deletePost = vi.fn();
vi.mock("@/services/discussion.service", () => ({
  discussionService: {
    getPostBySlug: (...a: unknown[]) => getPostBySlug(...a),
    deletePost: (...a: unknown[]) => deletePost(...a),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useDeleteDiscussion, useDiscussionPost } from "./use-discussions";

function setup() {
  const qc = createAppQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  const view = renderHook(() => ({ detail: useDiscussionPost("bai-cua-toi"), remove: useDeleteDiscussion("bai-cua-toi") }), { wrapper });
  return { qc, view };
}

beforeEach(() => {
  getPostBySlug.mockReset().mockResolvedValue({ id: "p1", slug: "bai-cua-toi", comments: [] });
  deletePost.mockReset().mockResolvedValue(undefined);
  vi.mocked(toast.error).mockClear();
});

describe("useDeleteDiscussion", () => {
  it("xoá bài gốc: không GET lại bài đã xoá dù query chi tiết còn được gắn", async () => {
    const { qc, view } = setup();
    await waitFor(() => expect(view.result.current.detail.data?.id).toBe("p1"));
    await act(async () => {
      await view.result.current.remove.mutateAsync({ id: "p1", isRootPost: true });
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(deletePost).toHaveBeenCalledWith("p1");
    expect(getPostBySlug).toHaveBeenCalledTimes(1);
    qc.clear();
  });

  it("xoá bình luận: làm mới chi tiết bài (GET lần 2)", async () => {
    const { qc, view } = setup();
    await waitFor(() => expect(view.result.current.detail.data?.id).toBe("p1"));
    await act(async () => {
      await view.result.current.remove.mutateAsync({ id: "c1", isRootPost: false });
    });
    await waitFor(() => expect(getPostBySlug).toHaveBeenCalledTimes(2));
    qc.clear();
  });

  it("lỗi xoá: không có toast mặc định của app (trang tự báo một lần)", async () => {
    deletePost.mockImplementation(async () => {
      throw new ApiError(403, "FORBIDDEN", "forbidden");
    });
    const { qc, view } = setup();
    await act(async () => {
      await view.result.current.remove.mutateAsync({ id: "p1", isRootPost: true }).catch(() => undefined);
    });
    expect(toast.error).not.toHaveBeenCalled();
    qc.clear();
  });
});
