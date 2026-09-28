/**
 * Thanh mua cố định trên mobile (B8): chỉ hiện khi thẻ giá chính còn nằm hẳn PHÍA DƯỚI màn hình.
 * - Review #34 MINOR: thẻ đã cuộn qua phía trên (vùng footer) thì ẩn, trước đây thanh che footer.
 * - Re-review vòng 2 MINOR: nhảy thẳng từ cuối trang lên đầu trang (thẻ đi từ "trên" xuống "dưới"
 *   viewport, không qua trạng thái giao nhau) thì thanh phải hiện lại, không bị kẹt ẩn.
 */

import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CourseDetailSidebar } from "./course-detail-sidebar";
import type { CourseDetail } from "@/types/course";

vi.mock("@/services/order.service", () => ({
  orderService: { createOrder: vi.fn(), createPaymentIntent: vi.fn(), getPaymentStatus: vi.fn(), checkPayment: vi.fn(), cancelOrder: vi.fn() },
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

const course: CourseDetail = {
  id: "course-1",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  title: "Docker & Kubernetes thực chiến",
  slug: "docker-kubernetes-thuc-chien",
  description: "Mô tả",
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

const VIEWPORT_HEIGHT = 800;
let cardTop = 2000;

/** Đặt vị trí thẻ giá (top so với viewport) rồi phát sự kiện scroll như khi người dùng cuộn/nhảy. */
function scrollCardTo(top: number) {
  cardTop = top;
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("CourseDetailSidebar — thanh mua mobile", () => {
  beforeEach(() => {
    cardTop = 2000;
    vi.stubGlobal("innerHeight", VIEWPORT_HEIGHT);
    // rAF chạy đồng bộ để mỗi lần scroll cập nhật ngay trong act().
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () => ({ top: cardTop, bottom: cardTop + 400, left: 0, right: 0, width: 0, height: 400, x: 0, y: cardTop, toJSON: () => ({}) }) as DOMRect
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("hiện khi thẻ giá ở dưới; ẩn khi thẻ hiện hoặc đã cuộn qua; hiện lại khi nhảy thẳng về đầu trang", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <CourseDetailSidebar course={course} isEnrolled={false} progress={0} onEnroll={vi.fn()} onStartLearning={vi.fn()} onTrial={vi.fn()} />
      </QueryClientProvider>
    );

    // Lúc tải trang: thẻ giá còn ở phía dưới (top 2000 > cao màn hình 800).
    expect(screen.queryByTestId("mobile-buy-bar")).not.toBeNull();

    scrollCardTo(300); // thẻ giá đang hiện
    expect(screen.queryByTestId("mobile-buy-bar")).toBeNull();

    scrollCardTo(-400); // đã cuộn qua thẻ giá, đang ở vùng footer
    expect(screen.queryByTestId("mobile-buy-bar")).toBeNull();

    scrollCardTo(2000); // nhảy thẳng về đầu trang (Home / chạm thanh trạng thái iOS)
    expect(screen.queryByTestId("mobile-buy-bar")).not.toBeNull();
  });
});
