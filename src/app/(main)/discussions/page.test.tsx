/**
 * QA3 Q5: diễn đàn 77 bài chỉ hiện 20, không có cách xem tiếp, và "Tất cả 20" là số bài đã tải.
 * Trang phải có "Tải thêm", đếm theo `total` của API, và gộp các trang.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("@/components/landing/scroll-reveal", () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("./discussion-composer", () => ({ DiscussionComposer: () => null }));
vi.mock("@/hooks/queries/use-leaderboard", () => ({ useLeaderboard: () => ({ data: undefined }) }));

import DiscussionsPage from "./page";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const TOTAL = 45;
const allPosts = Array.from({ length: TOTAL }, (_, i) => ({
  id: `p${i}`,
  slug: `bai-${i}`,
  title: `Bài viết ${i}`,
  content: "nội dung",
  category: "programming",
  author_id: "u1",
  author_name: "An",
  created_at: "2026-11-01T00:00:00Z",
  updated_at: "2026-11-01T00:00:00Z",
  upvote_count: 0,
  reply_count: 0,
}));

beforeEach(() => {
  resetMockApi();
  mockApi.get.mockImplementation(async (_url: string, cfg: { params: { page: number; page_size: number } }) => {
    const { page, page_size } = cfg.params;
    return envelope({
      posts: allPosts.slice((page - 1) * page_size, page * page_size),
      total: TOTAL,
      page,
      page_size,
    });
  });
});

describe("DiscussionsPage — phân trang (QA3 Q5)", () => {
  it("hiện 20/45, đếm theo total của API, bấm 'Tải thêm' để xem tiếp tới hết", async () => {
    renderWithProviders(<DiscussionsPage />);

    expect(await screen.findByText("Đang hiển thị 20 / 45 bài viết")).toBeTruthy();
    expect(screen.getByText("Bài viết 19")).toBeTruthy();
    expect(screen.queryByText("Bài viết 20")).toBeNull();
    // "Tất cả" hiện tổng API (45), không phải 20 đã tải
    await waitFor(() => expect(screen.getAllByText("45").length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole("button", { name: "Tải thêm bài viết" }));
    expect(await screen.findByText("Đang hiển thị 40 / 45 bài viết")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tải thêm bài viết" }));
    expect(await screen.findByText("Đang hiển thị 45 / 45 bài viết")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Tải thêm bài viết" })).toBeNull();
  });
});
