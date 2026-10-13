/**
 * QA2 F-10: không có trang danh sách yêu thích (DB có 64 hàng wishlists không ai đọc). Trang này liệt kê khoá
 * học đã lưu (GET /wishlist) và cho bỏ lưu.
 */

import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import WishlistPage from "./page";
import { useAuthStore } from "@/stores/auth.store";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const ITEMS = [
  {
    id: "w1", course_id: "c1", user_id: "u", created_at: "2026-10-01T00:00:00Z",
    course: {
      id: "c1", title: "Next.js từ cơ bản", slug: "nextjs-co-ban", thumbnail_url: "", price: "499000", discount_price: "299000",
      level: "beginner", instructor_name: "Trần Giảng Viên", total_duration_mins: 600, total_lessons: 30, average_rating: "4.70", total_students: 80,
    },
  },
  {
    id: "w2", course_id: "c2", user_id: "u", created_at: "2026-09-01T00:00:00Z",
    course: {
      id: "c2", title: "Docker miễn phí", slug: "docker-mien-phi", thumbnail_url: "", price: "0", discount_price: null,
      level: "intermediate", instructor_name: "Lê Văn B", total_duration_mins: 60, total_lessons: 5, average_rating: "0.00", total_students: 0,
    },
  },
];

beforeEach(() => {
  resetMockApi();
  useAuthStore.setState({ isAuthenticated: true, sessionStatus: "authenticated", activeRole: "STUDENT" } as never);
  mockApi.get.mockResolvedValue(envelope({ items: ITEMS, total_item: 2 }));
  mockApi.delete.mockResolvedValue({ data: { message: "ok" } });
});

describe("/wishlist — danh sách yêu thích (F-10)", () => {
  it("liệt kê khoá đã lưu: tên link tới /courses/:slug, giảng viên, giá bán (giá gốc gạch), 'Miễn phí'", async () => {
    renderWithProviders(<WishlistPage />);

    const link = await screen.findByRole("link", { name: /Next\.js từ cơ bản/ });
    expect(link.getAttribute("href")).toBe("/courses/nextjs-co-ban");
    expect(mockApi.get).toHaveBeenCalledWith("/wishlist");
    expect(screen.getByText("Trần Giảng Viên")).toBeTruthy();
    const row = link.closest("li") as HTMLElement;
    expect(within(row).getByText(/299\.000/)).toBeTruthy();
    expect(within(row).getByText(/499\.000/).tagName).toBe("DEL");
    expect(screen.getByText("Miễn phí")).toBeTruthy();
    expect(screen.getByText("2 khoá học")).toBeTruthy();
  });

  it("bỏ lưu: DELETE /wishlist/:courseId rồi làm mới danh sách", async () => {
    renderWithProviders(<WishlistPage />);
    const link = await screen.findByRole("link", { name: /Next\.js từ cơ bản/ });
    mockApi.get.mockResolvedValue(envelope({ items: [ITEMS[1]], total_item: 1 }));

    fireEvent.click(within(link.closest("li") as HTMLElement).getByRole("button", { name: /Bỏ khỏi danh sách yêu thích/ }));

    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith("/wishlist/c1"));
    await waitFor(() => expect(screen.queryByText("Next.js từ cơ bản")).toBeNull());
    expect(screen.getByText("Docker miễn phí")).toBeTruthy();
  });

  it("trống: gợi ý khám phá khoá học (link /courses)", async () => {
    mockApi.get.mockResolvedValue(envelope({ items: [], total_item: 0 }));
    renderWithProviders(<WishlistPage />);

    expect(await screen.findByText("Bạn chưa lưu khoá học nào")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Khám phá khoá học" }).getAttribute("href")).toBe("/courses");
  });

  it("lỗi tải: báo lỗi có Thử lại, không giả làm 'chưa lưu khoá nào'", async () => {
    mockApi.get.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(envelope({ items: ITEMS, total_item: 2 }));
    renderWithProviders(<WishlistPage />);

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByText("Bạn chưa lưu khoá học nào")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Next.js từ cơ bản")).toBeTruthy();
  });
});
