/**
 * Q8-PG-10 (axe `heading-order`): /discussions nhảy h1 -> h3 (tiêu đề sidebar và thẻ bài viết). Mọi tiêu đề dưới h1 của trang là h2.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("@/components/landing/scroll-reveal", () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/hooks/queries/use-leaderboard", () => ({
  useLeaderboard: () => ({ data: { entries: [{ rank: 1, display_name: "An", points: 5 }] } }),
}));

import { DiscussionPostCard } from "./discussion-post-card";
import { DiscussionSidebar } from "./discussion-sidebar";
import { renderWithProviders } from "@/test/utils";

describe("tiêu đề /discussions (Q8-PG-10)", () => {
  it("sidebar: 'Chủ đề nổi bật' và 'Thành viên tích cực' là h2", () => {
    renderWithProviders(<DiscussionSidebar total={1} onCategoryChange={() => {}} />);
    expect(screen.getByRole("heading", { level: 2, name: "Chủ đề nổi bật" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Thành viên tích cực" })).toBeTruthy();
    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
  });

  it("thẻ bài viết: tiêu đề bài là h2", () => {
    render(
      <DiscussionPostCard
        post={{ id: "p", slug: "bai", title: "Bài 1", content: "x", category: "qna", author_id: "u", author_name: "Hoàng Văn E",
          created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z", upvote_count: 0, reply_count: 0 }}
        onVote={() => {}}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Bài 1" })).toBeTruthy();
    // Q8-PG-09: avatar chữ viết tắt "HE", không phải "HO" (hai chữ đầu của họ)
    expect(screen.getByText("HE")).toBeTruthy();
  });
});
