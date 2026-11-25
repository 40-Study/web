/**
 * Q6-PG-12(c) + Q6-PG-14: khách bấm tim -> sang đăng nhập (không toast lỗi 401), và không có ô soạn bài đầy đủ mà
 * chỉ có lối "Đăng nhập để đăng bài". Người đã đăng nhập vẫn có ô soạn và tim hoạt động.
 */
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("@/components/landing/scroll-reveal", () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("./discussion-composer", () => ({ DiscussionComposer: () => <div data-testid="composer" /> }));
vi.mock("@/hooks/queries/use-leaderboard", () => ({ useLeaderboard: () => ({ data: undefined }) }));

import DiscussionsPage from "./page";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import { useAuthStore } from "@/stores/auth.store";

const posts = [
  { id: "p1", slug: "bai-1", title: "Bài 1", content: "x", category: "qna", author_id: "u1", author_name: "An",
    created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z", upvote_count: 2, reply_count: 0 },
];

beforeEach(() => {
  resetMockApi();
  push.mockReset();
  mockApi.get.mockImplementation(async () => envelope({ posts, total: 1, page: 1, page_size: 20 }));
  mockApi.post.mockResolvedValue({ data: {} });
});

describe("DiscussionsPage — khách", () => {
  beforeEach(() => useAuthStore.setState({ isAuthenticated: false, sessionStatus: "anonymous" }));

  it("không có ô soạn bài; có link 'Đăng nhập để đăng bài' kèm redirect", async () => {
    renderWithProviders(<DiscussionsPage />);
    await screen.findByText("Bài 1");
    expect(screen.queryByTestId("composer")).toBeNull();
    expect(screen.getByRole("link", { name: "Đăng nhập để đăng bài" }).getAttribute("href")).toBe("/login?redirect=%2Fdiscussions");
  });

  it("bấm tim: chuyển sang đăng nhập, không gọi API vote", async () => {
    renderWithProviders(<DiscussionsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Thích bài viết (2)" }));
    expect(push).toHaveBeenCalledWith("/login?redirect=%2Fdiscussions");
    expect(mockApi.post).not.toHaveBeenCalled();
  });
});

describe("DiscussionsPage — đã đăng nhập", () => {
  beforeEach(() => useAuthStore.setState({ isAuthenticated: true, sessionStatus: "authenticated" }));

  it("có ô soạn bài; bấm tim gọi API vote, không chuyển trang", async () => {
    renderWithProviders(<DiscussionsPage />);
    expect(await screen.findByTestId("composer")).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Thích bài viết (2)" }));
    expect(push).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(mockApi.post).toHaveBeenCalled());
  });
});
