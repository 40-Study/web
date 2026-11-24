/**
 * QA4 S5: tác giả không xoá được bài/bình luận của mình (API `DELETE /discussions/:id` có sẵn,
 * web không gọi). Chỉ tác giả thấy nút Xoá; luôn có bước xác nhận; xoá bài gốc thì về /discussions.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let currentUserId: string | undefined = "u-author";
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { sessionStatus: string; user: { id: string } | null }) => unknown) =>
    selector({ sessionStatus: "authenticated", user: currentUserId ? { id: currentUserId } : null }),
}));

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const post = {
  id: "p1",
  slug: "bai-cua-toi",
  title: "Bài của tôi",
  content: "<p>nội dung</p>",
  category: "project",
  author_id: "u-author",
  author_name: "An",
  created_at: new Date().toISOString(),
  upvote_count: 0,
  reply_count: 2,
  comments: [
    { id: "c-mine", content: "<p>của tôi</p>", author_id: "u-author", author_name: "An", created_at: new Date().toISOString(), upvote_count: 0, replies: [] },
    { id: "c-other", content: "<p>của bạn</p>", author_id: "u-other", author_name: "Bình", created_at: new Date().toISOString(), upvote_count: 0, replies: [] },
  ],
};
const mutateAsync = vi.fn().mockResolvedValue(undefined);
vi.mock("@/hooks/queries/use-discussions", () => ({
  useDiscussionPost: () => ({ data: post, isLoading: false }),
  useAddDiscussionComment: () => ({ mutate: vi.fn(), isPending: false }),
  useVoteDiscussion: () => ({ mutate: vi.fn() }),
  useRemoveVoteDiscussion: () => ({ mutate: vi.fn() }),
  useDeleteDiscussion: () => ({ mutateAsync, isPending: false }),
}));
vi.mock("@/components/editor/tiptap-editor", () => ({ TiptapEditor: () => <div /> }));

import DiscussionDetailPage from "./page";

beforeEach(() => {
  currentUserId = "u-author";
  mutateAsync.mockClear();
  replace.mockClear();
});

describe("DiscussionDetailPage — tác giả xoá bài/bình luận (S5)", () => {
  it("tác giả thấy Xoá bài viết và Xoá bình luận chỉ trên bình luận của mình", () => {
    render(<DiscussionDetailPage params={{ slug: "bai-cua-toi" }} />);
    expect(screen.getByRole("button", { name: /Xoá bài viết/ })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Xoá bình luận/ })).toHaveLength(1);
  });

  it("người khác không thấy nút Xoá nào", () => {
    currentUserId = "u-stranger";
    render(<DiscussionDetailPage params={{ slug: "bai-cua-toi" }} />);
    expect(screen.queryByRole("button", { name: /Xoá/ })).toBeNull();
  });

  it("xoá bài cần xác nhận, rồi gọi DELETE bài gốc và về /discussions", async () => {
    render(<DiscussionDetailPage params={{ slug: "bai-cua-toi" }} />);
    fireEvent.click(screen.getByRole("button", { name: /Xoá bài viết/ }));
    expect(mutateAsync).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
    });
    expect(mutateAsync).toHaveBeenCalledWith({ id: "p1", isRootPost: true });
    expect(replace).toHaveBeenCalledWith("/discussions");
  });

  it("xoá bình luận gọi DELETE đúng id, ở lại trang", async () => {
    render(<DiscussionDetailPage params={{ slug: "bai-cua-toi" }} />);
    fireEvent.click(screen.getByRole("button", { name: /Xoá bình luận/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
    });
    expect(mutateAsync).toHaveBeenCalledWith({ id: "c-mine", isRootPost: false });
    expect(replace).not.toHaveBeenCalled();
  });
});
