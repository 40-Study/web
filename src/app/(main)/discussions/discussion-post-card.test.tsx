/**
 * Q6-PG-12: nút tim và liên kết phản hồi không có tên truy cập (chỉ có số), "Chia sẻ" sao chép im lặng và ném lỗi
 * chưa bắt khi clipboard bị từ chối. Q6-PG-13: nhãn "Hỏi đáp" / "Chung" cho bài qna / general / không danh mục.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/landing/scroll-reveal", () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { DiscussionPostCard } from "./discussion-post-card";
import { toast } from "sonner";
import type { ForumPost } from "@/types/discussion";

const post = (over: Partial<ForumPost> = {}) =>
  ({
    id: "p1", slug: "bai-1", title: "Bài 1", content: "<p>nội dung</p>", category: "programming",
    author_id: "u1", author_name: "An", created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z",
    upvote_count: 1, reply_count: 4, user_vote: null, ...over,
  }) as unknown as ForumPost;

beforeEach(() => {
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});
afterEach(() => vi.unstubAllGlobals());

describe("DiscussionPostCard — tên truy cập", () => {
  it("tim và liên kết phản hồi có aria-label kèm số", () => {
    render(<DiscussionPostCard post={post()} onVote={vi.fn()} />);
    const heart = screen.getByRole("button", { name: "Thích bài viết (1)" });
    expect(heart.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("link", { name: "Xem 4 phản hồi" })).toBeTruthy();
  });

  it("đã thích: 'Bỏ thích bài viết (n)', aria-pressed=true", () => {
    render(<DiscussionPostCard post={post({ user_vote: "upvote" })} onVote={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Bỏ thích bài viết (1)" }).getAttribute("aria-pressed")).toBe("true");
  });
});

describe("DiscussionPostCard — chia sẻ", () => {
  it("sao chép được: toast 'Đã sao chép liên kết'", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<DiscussionPostCard post={post()} onVote={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Chia sẻ/ }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Đã sao chép liên kết"));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/discussions/bai-1`);
  });

  it("clipboard bị từ chối: toast lỗi, không ném lỗi chưa bắt", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError")) } });
    render(<DiscussionPostCard post={post()} onVote={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Chia sẻ/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Không sao chép được liên kết"));
    await new Promise((r) => setTimeout(r, 0));
    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it("không có clipboard API: toast lỗi", async () => {
    vi.stubGlobal("navigator", {});
    render(<DiscussionPostCard post={post()} onVote={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Chia sẻ/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Không sao chép được liên kết"));
  });
});

describe("DiscussionPostCard — nhãn danh mục", () => {
  it.each([
    ["qna", "Hỏi đáp"],
    ["general", "Chung"],
    [null, "Chung"],
    ["programming", "Lập trình"],
  ])("category %s -> %s", (category, label) => {
    render(<DiscussionPostCard post={post({ category: category as never })} onVote={vi.fn()} />);
    expect(screen.getByText(label)).toBeTruthy();
  });
});

// QA7 S7-08: vùng bấm của tim / phản hồi / chia sẻ chỉ cao 22px; tối thiểu 32px, 44px trên điện thoại.
describe("DiscussionPostCard — vùng bấm (S7-08)", () => {
  it("tim, liên kết phản hồi và chia sẻ có min-h-8 min-w-8 và max-sm:min-h-11", () => {
    render(<DiscussionPostCard post={post()} onVote={vi.fn()} />);
    const targets = [
      screen.getByRole("button", { name: "Thích bài viết (1)" }),
      screen.getByRole("link", { name: "Xem 4 phản hồi" }),
      screen.getByRole("button", { name: /Chia sẻ/ }),
    ];
    for (const el of targets) {
      const cls = el.className.split(/\s+/);
      expect(cls).toContain("min-h-8");
      expect(cls).toContain("min-w-8");
      expect(cls).toContain("max-sm:min-h-11");
    }
  });
});
