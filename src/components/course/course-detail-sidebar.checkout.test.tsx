/**
 * Review PR #25 (BLOCKER #1): "Mua ngay" double-click/double-submit tạo 2
 * đơn hàng thật độc lập, vì `idempotency_key` được sinh MỚI (uuidv4() inline)
 * mỗi lần handleCheckoutConfirm chạy thay vì cố định theo 1 phiên checkout.
 *
 * Test này xác nhận đúng yêu cầu review: "2 lần submit liên tiếp -> cùng
 * key / chỉ 1 request" — ở đây kiểm cả 2 vế:
 * 1. Bấm "Thanh toán" khi lần trước THẤT BẠI (modal còn mở) -> lần 2 dùng
 *    LẠI đúng idempotency_key cũ (retry, không phải đơn mới).
 * 2. Bấm "Thanh toán" THÀNH CÔNG -> modal đóng, sinh key MỚI -> mở lại "Mua
 *    ngay" một lần mua khác dùng key KHÁC hẳn 2 key trước.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CourseDetailSidebar } from "./course-detail-sidebar";
import { useAuthStore } from "@/stores/auth.store";
import type { CourseDetail } from "@/types/course";
import type { CreateOrderDTO, Order } from "@/services/order.service";

vi.mock("@/services/order.service", () => ({
  orderService: {
    createOrder: vi.fn(),
    getMyOrders: vi.fn(),
    getOrder: vi.fn(),
    cancelOrder: vi.fn(),
    createPaymentIntent: vi.fn(),
    getPaymentStatus: vi.fn(),
    checkPayment: vi.fn(),
  },
}));

vi.mock("@/services/cart.service", () => ({
  cartService: {
    getCart: vi.fn().mockResolvedValue({ items: [], total: 0, item_count: 0 }),
    addToCart: vi.fn(),
    isInCart: vi.fn().mockResolvedValue(false),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
  },
}));

import { orderService } from "@/services/order.service";

const mockCourse: CourseDetail = {
  id: "course-1",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  title: "Docker & Kubernetes thực chiến",
  slug: "docker-kubernetes-thuc-chien",
  description: "Mô tả khoá học",
  thumbnail: "https://example.com/thumb.jpg",
  price: 799000,
  rating: 0,
  reviewCount: 0,
  studentCount: 0,
  instructor: { id: "instructor-1", name: "Giảng viên Test" },
  category: { id: "cat-1", name: "DevOps", slug: "devops" },
  level: "beginner",
  language: "Tiếng Việt",
  duration: 120,
  lessonCount: 4,
  learningOutcomes: [],
  sections: [],
  reviews: [],
  ratingDistribution: {},
};

function makeZeroAmountOrder(id: string): Order {
  return {
    id,
    order_number: `ORD-${id}`,
    subtotal: 0,
    discount_amount: 799000,
    tax_amount: 0,
    total_amount: 0,
    currency: "VND",
    status: "completed",
    items: [],
    created_at: "2026-01-01T00:00:00Z",
  };
}

function renderSidebar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CourseDetailSidebar
        course={mockCourse}
        isEnrolled={false}
        progress={0}
        onEnroll={vi.fn()}
        onStartLearning={vi.fn()}
        onTrial={vi.fn()}
      />
    </QueryClientProvider>
  );
}

function clickBuyNow() {
  fireEvent.click(screen.getByRole("button", { name: "Mua ngay" }));
}

function clickConfirmPayment() {
  fireEvent.click(screen.getByRole("button", { name: /Thanh toán/ }));
}

/**
 * Đợi ĐỦ 2 điều kiện trước khi bấm lại: mock đã được gọi đúng `expectedCalls`
 * lần VÀ nút "Thanh toán" đã hết `disabled`. React Query's `isPending` chuyển
 * về false ở lượt render SAU khi mutationFn (mock) đã được gọi/reject — 2 mốc
 * này không đồng bộ trong cùng tick. Gộp vào 1 `waitFor` (thay vì 2 lời gọi
 * `waitFor` tách rời) để tránh flake: bấm lại NGAY khi chỉ mới thấy call-count
 * đủ nhưng nút còn khoá sẽ bị chính guard double-submit của CheckoutModal
 * chặn, cho ra "got N-1 times" giả — khác hẳn double-click thật.
 */
async function waitSettledAfterConfirm(expectedCalls: number) {
  await waitFor(() => {
    expect(orderService.createOrder).toHaveBeenCalledTimes(expectedCalls);
    const btn = screen.queryByRole("button", { name: /Thanh toán/ }) as HTMLButtonElement | null;
    // null hợp lệ khi modal đã tự đóng (đơn tạo thành công) — không còn nút để kiểm disabled.
    if (btn) expect(btn.disabled).toBe(false);
  });
}

describe("CourseDetailSidebar — idempotency_key khi Mua ngay (PR #25 BLOCKER #1)", () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      hasHydrated: true,
      user: { id: "user-1", email: "student1@demo.com", name: "Student 1" },
    });
  });

  afterEach(() => {
    useAuthStore.getState().clearServerSession();
    vi.mocked(orderService.createOrder).mockReset();
  });

  it("submit thất bại rồi bấm lại -> cùng idempotency_key (retry, không phải đơn mới)", async () => {
    vi.mocked(orderService.createOrder).mockRejectedValue(new Error("network error"));

    renderSidebar();
    clickBuyNow();
    await waitFor(() => screen.getByText("Xác nhận mua khóa học"));

    clickConfirmPayment();
    await waitSettledAfterConfirm(1);

    // Modal PHẢI còn mở sau khi lỗi (không tự đóng) để bấm lại được.
    expect(screen.queryByText("Xác nhận mua khóa học")).not.toBeNull();

    clickConfirmPayment();
    await waitSettledAfterConfirm(2);

    const calls = vi.mocked(orderService.createOrder).mock.calls as [CreateOrderDTO][];
    expect(calls[0][0].idempotency_key).toBe(calls[1][0].idempotency_key);
  });

  it("submit thành công -> đóng modal, lần mua KHÁC sau đó dùng idempotency_key khác", async () => {
    vi.mocked(orderService.createOrder).mockResolvedValueOnce(makeZeroAmountOrder("order-a"));

    renderSidebar();
    clickBuyNow();
    await waitFor(() => screen.getByText("Xác nhận mua khóa học"));
    clickConfirmPayment();
    await waitSettledAfterConfirm(1);

    // Đơn 0đ tạo xong -> modal tự đóng (điều hướng sang trang thành công).
    await waitFor(() => expect(screen.queryByText("Xác nhận mua khóa học")).toBeNull());

    // Mở lại "Mua ngay" cho một lần mua khác.
    vi.mocked(orderService.createOrder).mockResolvedValueOnce(makeZeroAmountOrder("order-b"));
    clickBuyNow();
    await waitFor(() => screen.getByText("Xác nhận mua khóa học"));
    clickConfirmPayment();
    await waitSettledAfterConfirm(2);

    const calls = vi.mocked(orderService.createOrder).mock.calls as [CreateOrderDTO][];
    expect(calls[0][0].idempotency_key).not.toBe(calls[1][0].idempotency_key);
  });
});
