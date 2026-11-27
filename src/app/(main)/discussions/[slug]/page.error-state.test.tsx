/**
 * Q9-PG-02: API bài viết lỗi (5xx, mất mạng) từng hiện "Bài viết không tồn tại. Quay lại diễn đàn", như thể bài đã bị xoá.
 * Chỉ 404 thật mới là "không tồn tại"; lỗi khác phải hiện lỗi + Thử lại.
 */
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("@/components/editor/tiptap-editor", () => ({ TiptapEditor: () => <div data-testid="comment-editor" /> }));

import DiscussionDetailPage from "./page";
import { ApiError, NotFoundError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const post = {
  id: "p1",
  slug: "bai-1",
  title: "Tìm bạn làm đồ án",
  content: "<p>nội dung</p>",
  category: "project",
  author_id: "u1",
  author_name: "An",
  created_at: new Date().toISOString(),
  upvote_count: 0,
  reply_count: 0,
  comments: [],
};

beforeEach(() => resetMockApi());

describe("DiscussionDetailPage — API lỗi (Q9-PG-02)", () => {
  it("500: hiện lỗi + Thử lại, KHÔNG nói 'Bài viết không tồn tại'; bấm Thử lại tải được bài", async () => {
    mockApi.get.mockRejectedValue(new ApiError(500, "ERR_INTERNAL", "boom"));
    renderWithProviders(<DiscussionDetailPage params={{ slug: "bai-1" }} />);

    expect(await screen.findByText("Không thể tải dữ liệu")).toBeTruthy();
    expect(screen.queryByText("Bài viết không tồn tại.")).toBeNull();
    expect(screen.getByRole("link", { name: "Quay lại diễn đàn" })).toBeTruthy();

    mockApi.get.mockResolvedValue(envelope(post));
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByRole("heading", { name: "Tìm bạn làm đồ án" })).toBeTruthy();
  });

  it("404 thật vẫn là 'Bài viết không tồn tại', không có nút Thử lại", async () => {
    mockApi.get.mockRejectedValue(new NotFoundError("Resource not found"));
    renderWithProviders(<DiscussionDetailPage params={{ slug: "khong-co" }} />);

    expect(await screen.findByText("Bài viết không tồn tại.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
  });
});
