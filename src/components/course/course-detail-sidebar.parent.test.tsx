/**
 * Q6-PG-01: phụ huynh không đăng ký / thêm giỏ / mua khoá cho mình (cart, "Khoá học của tôi" và khu học đều
 * dành cho học viên). Nút bị ẩn thay bằng một dòng giải thích; học viên và khách vẫn thấy đủ nút.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import type { CourseDetail } from "@/types/course";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/services/cart.service", () => ({
  cartService: {
    getCart: vi.fn().mockResolvedValue({ items: [], total: 0, total_item: 0 }),
    addToCart: vi.fn().mockResolvedValue(undefined),
    isInCart: vi.fn().mockResolvedValue(false),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
  },
}));
vi.mock("@/services/course.service", () => ({
  courseService: { getEnrolledCourses: vi.fn().mockResolvedValue([]) },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

import { CourseDetailSidebar } from "./course-detail-sidebar";
import { cartService } from "@/services/cart.service";
import { savePendingCartIntent } from "@/lib/pending-cart-intent";

const base = {
  id: "course-1", slug: "python-co-ban", title: "Python cơ bản", thumbnail: "https://example.com/t.jpg",
  duration: 60, lessonCount: 3, instructor: { id: "gv-1", name: "Giảng viên" },
  category: { id: "cat-1", name: "Lập trình", slug: "lap-trinh" },
};
const paid = { ...base, price: 499000, sections: [{ lessons: [{ isFreePreview: true }] }] } as unknown as CourseDetail;
const free = { ...base, price: 0, sections: [] } as unknown as CourseDetail;

function renderSidebar(course: CourseDetail, isEnrolled = false) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CourseDetailSidebar course={course} isEnrolled={isEnrolled} progress={0} onEnroll={vi.fn()} onStartLearning={vi.fn()} onTrial={vi.fn()} />
    </QueryClientProvider>
  );
}

function signIn(role: "PARENT" | "STUDENT") {
  useAuthStore.setState({ sessionStatus: "authenticated", isAuthenticated: true, hasHydrated: true, activeRole: role });
}

beforeEach(() => {
  window.sessionStorage.clear();
  vi.mocked(cartService.addToCart).mockClear();
});
afterEach(() => useAuthStore.getState().clearServerSession());

describe("CourseDetailSidebar — vai Phụ huynh (Q6-PG-01)", () => {
  it("khoá trả phí: không có Thêm vào giỏ / Mua ngay / thanh mua / mã giảm giá / xem thử, có dòng giải thích", () => {
    signIn("PARENT");
    renderSidebar(paid);
    expect(screen.getByTestId("parent-cannot-purchase")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Thêm vào giỏ/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Mua ngay" })).toBeNull();
    expect(screen.queryByTestId("mobile-buy-bar")).toBeNull();
    expect(screen.queryByText("Mã giảm giá")).toBeNull();
    expect(screen.queryByRole("button", { name: "Xem thử miễn phí" })).toBeNull();
  });

  it("khoá miễn phí: không có nút Đăng ký miễn phí", () => {
    signIn("PARENT");
    renderSidebar(free);
    expect(screen.getByTestId("parent-cannot-purchase")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Đăng ký miễn phí" })).toBeNull();
  });

  it("khoá đã ghi danh từ trước: không có nút Bắt đầu học (khu học trả 403 cho phụ huynh)", () => {
    signIn("PARENT");
    renderSidebar(free, true);
    expect(screen.queryByRole("button", { name: "Bắt đầu học" })).toBeNull();
  });

  it("ý định thêm giỏ của khách, đăng nhập bằng Phụ huynh: bị xoá và KHÔNG tự thêm vào giỏ", async () => {
    savePendingCartIntent("course-1", "python-co-ban");
    signIn("PARENT");
    renderSidebar(paid);
    await waitFor(() => expect(window.sessionStorage.length).toBe(0));
    expect(cartService.addToCart).not.toHaveBeenCalled();
  });

  it("học viên vẫn thấy đủ nút mua", () => {
    signIn("STUDENT");
    renderSidebar(paid);
    expect(screen.queryByTestId("parent-cannot-purchase")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Thêm vào giỏ/ }));
    expect(screen.getByRole("button", { name: "Mua ngay" })).toBeTruthy();
  });
});
