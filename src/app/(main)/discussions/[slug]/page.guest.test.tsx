/**
 * G-03 (QA3 261104): khách thấy ô soạn bình luận, bấm gửi nhận 401 "Phiên đăng nhập đã hết hạn" dù chưa từng có phiên.
 * Khách phải thấy lời mời đăng nhập (quay lại đúng bài); người đã đăng nhập vẫn có ô soạn.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let sessionStatus: "checking" | "authenticated" | "anonymous" = "anonymous";
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { sessionStatus: string }) => unknown) => selector({ sessionStatus }),
}));

const post = {
  id: "p1",
  title: "Tìm bạn làm đồ án",
  content: "<p>nội dung</p>",
  category: "project",
  author_name: "An",
  created_at: new Date().toISOString(),
  upvote_count: 0,
  reply_count: 1,
  comments: [
    { id: "c1", content: "<p>chào</p>", author_name: "Bình", created_at: new Date().toISOString(), upvote_count: 0, replies: [] },
  ],
};
vi.mock("@/hooks/queries/use-discussions", () => ({
  useDiscussionPost: () => ({ data: post, isLoading: false }),
  useAddDiscussionComment: () => ({ mutate: vi.fn(), isPending: false }),
  useVoteDiscussion: () => ({ mutate: vi.fn() }),
  useRemoveVoteDiscussion: () => ({ mutate: vi.fn() }),
}));
vi.mock("@/components/editor/tiptap-editor", () => ({
  TiptapEditor: () => <div data-testid="comment-editor" />,
}));

import DiscussionDetailPage from "./page";

beforeEach(() => {
  sessionStatus = "anonymous";
});

describe("DiscussionDetailPage — ô bình luận theo phiên", () => {
  it("khách: không có ô soạn, có link đăng nhập quay lại bài, không có nút Trả lời", () => {
    render(<DiscussionDetailPage params={{ slug: "tim-ban-lam-do-an" }} />);
    expect(screen.queryByTestId("comment-editor")).toBeNull();
    expect(screen.queryByText("Gửi bình luận")).toBeNull();
    expect(screen.queryByText("Trả lời")).toBeNull();
    const login = screen.getByRole("link", { name: "Đăng nhập" });
    expect(login.getAttribute("href")).toBe("/login?redirect=%2Fdiscussions%2Ftim-ban-lam-do-an");
  });

  it("đã đăng nhập: có ô soạn và nút Trả lời, không có lời mời đăng nhập", () => {
    sessionStatus = "authenticated";
    render(<DiscussionDetailPage params={{ slug: "tim-ban-lam-do-an" }} />);
    expect(screen.getByTestId("comment-editor")).toBeTruthy();
    expect(screen.getByText("Trả lời")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Đăng nhập" })).toBeNull();
  });

  it("đang khôi phục phiên: chưa hiện gì ở chỗ ô soạn (không chớp CTA cho người đã đăng nhập)", () => {
    sessionStatus = "checking";
    render(<DiscussionDetailPage params={{ slug: "x" }} />);
    expect(screen.queryByTestId("comment-editor")).toBeNull();
    expect(screen.queryByRole("link", { name: "Đăng nhập" })).toBeNull();
  });
});
