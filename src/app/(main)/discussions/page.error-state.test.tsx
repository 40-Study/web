/**
 * Q8-PG-04: API bài thảo luận lỗi từng hiện "Chưa có bài viết nào. Hãy mở đầu cuộc thảo luận!" và sidebar "Tất cả 0"
 * (mời người dùng đăng bài vào lúc hệ thống sự cố). Phải hiện lỗi + Thử lại và ẩn các số đếm.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
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
import { renderWithProviders } from "@/test/utils";

beforeEach(() => resetMockApi());

describe("DiscussionsPage — API lỗi (Q8-PG-04)", () => {
  it("hiện lỗi + Thử lại thay vì trạng thái rỗng, và ẩn số đếm 'Tất cả 0'", async () => {
    mockApi.get.mockRejectedValue(new ApiError(500, "ERR_INTERNAL", "boom"));
    renderWithProviders(<DiscussionsPage />);

    expect(await screen.findByText("Không thể tải dữ liệu")).toBeTruthy();
    expect(screen.queryByText(/Chưa có bài viết nào/)).toBeNull();
    const all = screen.getByRole("button", { name: /^Tất cả/ });
    expect(all.textContent).toBe("Tất cả");

    mockApi.get.mockResolvedValue(envelope({ posts: [], total: 0, page: 1, page_size: 20 }));
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText(/Chưa có bài viết nào/)).toBeTruthy();
  });

  it("danh sách rỗng thật (API ok) vẫn là 'Chưa có bài viết nào' và có số đếm", async () => {
    mockApi.get.mockResolvedValue(envelope({ posts: [], total: 0, page: 1, page_size: 20 }));
    renderWithProviders(<DiscussionsPage />);
    expect(await screen.findByText(/Chưa có bài viết nào/)).toBeTruthy();
    await waitFor(() => expect(screen.getByRole("button", { name: /^Tất cả/ }).textContent).toBe("Tất cả0"));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
