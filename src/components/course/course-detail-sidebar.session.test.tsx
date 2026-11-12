/**
 * UX-A-02: lúc còn kiểm phiên, bấm "Thêm vào giỏ" từng bị nuốt im lặng -> nút khoá kèm spinner.
 * UX-A-03: khách bấm "Thêm vào giỏ" -> báo "Đăng nhập để thêm vào giỏ", sang login giữ đường quay lại,
 * đăng nhập xong quay lại trang khoá thì tự thêm đúng khoá đó (không giỏ tạm).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import type { CourseDetail } from "@/types/course";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
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
import { toast } from "sonner";
import { readPendingCartIntent, savePendingCartIntent } from "@/lib/pending-cart-intent";

const course = {
  id: "course-1",
  slug: "python-co-ban",
  title: "Python cơ bản",
  thumbnail: "https://example.com/t.jpg",
  price: 499000,
  duration: 60,
  lessonCount: 3,
  sections: [],
  instructor: { id: "gv-1", name: "Giảng viên" },
  category: { id: "cat-1", name: "Lập trình", slug: "lap-trinh" },
} as unknown as CourseDetail;

function renderSidebar(isEnrolled = false) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CourseDetailSidebar
        course={course}
        isEnrolled={isEnrolled}
        progress={0}
        onEnroll={vi.fn()}
        onStartLearning={vi.fn()}
        onTrial={vi.fn()}
      />
    </QueryClientProvider>
  );
}

function setSession(status: "checking" | "anonymous" | "authenticated") {
  useAuthStore.setState({ sessionStatus: status, isAuthenticated: status === "authenticated", hasHydrated: true });
}

beforeEach(() => {
  window.sessionStorage.clear();
  push.mockReset();
  vi.mocked(cartService.addToCart).mockClear();
  vi.mocked(cartService.isInCart).mockResolvedValue(false);
  vi.mocked(toast.info).mockClear();
});

afterEach(() => {
  useAuthStore.getState().clearServerSession();
});

describe("CourseDetailSidebar — phiên chưa rõ (UX-A-02)", () => {
  it("đang kiểm phiên: nút thêm giỏ khoá kèm chữ đang kiểm, bấm không đẩy sang login", () => {
    setSession("checking");
    renderSidebar();
    const button = screen.getByRole("button", { name: /Đang kiểm tra đăng nhập/ });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Mua ngay" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(push).not.toHaveBeenCalled();
  });
});

describe("CourseDetailSidebar — khách thêm giỏ (UX-A-03)", () => {
  it("khách bấm: báo lý do, lưu ý định đúng khoá, sang login quay lại trang khoá", () => {
    setSession("anonymous");
    renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: "Thêm vào giỏ hàng" }));

    expect(toast.info).toHaveBeenCalledWith("Đăng nhập để thêm vào giỏ");
    expect(readPendingCartIntent()).toMatchObject({ courseId: "course-1", slug: "python-co-ban" });
    expect(push).toHaveBeenCalledWith(`/login?redirect=${encodeURIComponent("/courses/python-co-ban")}`);
    expect(cartService.addToCart).not.toHaveBeenCalled();
  });

  it("đăng nhập xong quay lại trang khoá: tự thêm đúng khoá một lần rồi xoá ý định", async () => {
    savePendingCartIntent("course-1", "python-co-ban");
    setSession("authenticated");
    renderSidebar();

    await waitFor(() => expect(cartService.addToCart).toHaveBeenCalledTimes(1));
    expect(vi.mocked(cartService.addToCart).mock.calls[0][0]).toBe("course-1");
    expect(readPendingCartIntent()).toBeNull();
  });

  it("ý định của khoá khác: không thêm khoá đang xem", async () => {
    savePendingCartIntent("course-2", "khoa-khac");
    setSession("authenticated");
    renderSidebar();

    await waitFor(() => expect(cartService.isInCart).toHaveBeenCalled());
    expect(cartService.addToCart).not.toHaveBeenCalled();
    expect(readPendingCartIntent()).not.toBeNull();
  });

  it("đã sở hữu khoá: không thêm vào giỏ, báo đã sở hữu", async () => {
    savePendingCartIntent("course-1", "python-co-ban");
    setSession("authenticated");
    renderSidebar(true);

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith("Bạn đã sở hữu khoá học này"));
    expect(cartService.addToCart).not.toHaveBeenCalled();
  });

  it("khoá đã có trong giỏ: không thêm lần nữa", async () => {
    vi.mocked(cartService.isInCart).mockResolvedValue(true);
    savePendingCartIntent("course-1", "python-co-ban");
    setSession("authenticated");
    renderSidebar();

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith("Khoá học đã có trong giỏ hàng"));
    expect(cartService.addToCart).not.toHaveBeenCalled();
  });
});
