/**
 * Q11-STU-01: /discussions tải được bài, rồi refetch nền lỗi: giữ bài cache + MỘT thông báo 'Thử lại'
 * (như 13 trang khác ở Q10-STU-01). Trước đây nhánh lỗi chỉ đọc `isError && posts.length === 0` nên im lặng.
 */
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
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
import { ApiError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { expectStaleNoticeWithRetry, refetchAllActiveQueries, staleNoticeCount } from "@/test/stale-refetch";
import { renderWithProviders } from "@/test/utils";

const post = {
  id: "p1", slug: "bai-1", title: "Bài viết đã cache", content: "nội dung", category: "programming",
  author_id: "u1", author_name: "An", created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z",
  upvote_count: 0, reply_count: 0,
};

let failing = false;
beforeEach(() => {
  resetMockApi();
  failing = false;
  mockApi.get.mockImplementation(async () => {
    if (failing) throw new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");
    return envelope({ posts: [post], total: 1, page: 1, page_size: 20 });
  });
});

describe("/discussions — Q11-STU-01", () => {
  it("refetch nền lỗi: còn bài + một thông báo 'Thử lại', không có hộp lỗi", async () => {
    const { queryClient } = renderWithProviders(<DiscussionsPage />);
    await screen.findByText("Bài viết đã cache");
    expect(staleNoticeCount()).toBe(0);

    failing = true;
    await refetchAllActiveQueries(queryClient);
    await expectStaleNoticeWithRetry();
    expect(screen.getByText("Bài viết đã cache")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();

    failing = false;
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await screen.findByText("Bài viết đã cache");
  });
});
