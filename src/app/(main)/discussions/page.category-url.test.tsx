/** Q7-PG-02: chip danh mục của /discussions nằm trên URL (?category=), tải lại giữ nguyên; giá trị lạ bị bỏ qua. */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let currentParams = new URLSearchParams();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => currentParams,
}));
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

beforeEach(() => {
  currentParams = new URLSearchParams();
  replace.mockReset();
  resetMockApi();
  mockApi.get.mockImplementation(async () => envelope({ posts: [], total: 0, page: 1, page_size: 20 }));
});

// Chỉ các lần tải DANH SÁCH (page_size 20); các lần đếm tổng theo danh mục dùng page_size nhỏ hơn.
const categoryParamsSent = () =>
  mockApi.get.mock.calls
    .map(([, cfg]) => (cfg as { params?: { category?: string; page_size?: number } } | undefined)?.params)
    .filter((p) => p?.page_size === 20)
    .map((p) => p?.category);

describe("DiscussionsPage — chip danh mục trên URL (Q7-PG-02)", () => {
  it("bấm chip 'Lập trình' ghi ?category=programming bằng router.replace; bấm 'Tất cả' về /discussions", async () => {
    renderWithProviders(<DiscussionsPage />);
    fireEvent.click(await screen.findByRole("button", { name: /Lập trình/ }));
    expect(replace).toHaveBeenLastCalledWith("/discussions?category=programming", { scroll: false });
    fireEvent.click(screen.getByRole("button", { name: /Tất cả/ }));
    expect(replace).toHaveBeenLastCalledWith("/discussions", { scroll: false });
  });

  it("tải trang với ?category=qna: lọc theo qna ngay từ lần gọi API đầu", async () => {
    currentParams = new URLSearchParams("category=qna");
    renderWithProviders(<DiscussionsPage />);
    await waitFor(() => expect(categoryParamsSent()).toContain("qna"));
    expect(categoryParamsSent()[0]).toBe("qna");
  });

  it("?category= lạ bị bỏ qua: không lọc", async () => {
    currentParams = new URLSearchParams("category=nope");
    renderWithProviders(<DiscussionsPage />);
    await waitFor(() => expect(categoryParamsSent().length).toBeGreaterThan(0));
    expect(categoryParamsSent().every((c) => c === undefined)).toBe(true);
  });

  // L-2: URL đổi sau lần tải đầu (footer "/discussions" khi đang ở ?category=qna) thì chip và danh sách theo URL.
  it("?category=qna -> /discussions: bỏ lọc; sang ?category=programming: lọc theo programming; không ghi ngược lên URL", async () => {
    currentParams = new URLSearchParams("category=qna");
    const { rerender } = renderWithProviders(<DiscussionsPage />);
    await waitFor(() => expect(categoryParamsSent()).toContain("qna"));

    mockApi.get.mockClear();
    currentParams = new URLSearchParams();
    rerender(<DiscussionsPage />);
    await waitFor(() => expect(categoryParamsSent()).toContain(undefined));

    mockApi.get.mockClear();
    currentParams = new URLSearchParams("category=programming");
    rerender(<DiscussionsPage />);
    await waitFor(() => expect(categoryParamsSent()).toContain("programming"));
    expect(replace).not.toHaveBeenCalled();
  });
});
