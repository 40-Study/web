/**
 * Thanh mua cố định trên mobile (B8) và review #34 MINOR: thanh chỉ hiện khi thẻ giá chính còn ở
 * PHÍA DƯỚI màn hình. Khi thẻ đang hiện hoặc đã cuộn qua phía trên (vùng footer) thì ẩn, trước
 * đây nó hiện lại ở đó và che ~70px cuối footer.
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

type ObserverCallback = (entries: Array<Partial<IntersectionObserverEntry>>) => void;
let observerCallback: ObserverCallback | null = null;

class FakeIntersectionObserver {
  constructor(cb: ObserverCallback) {
    observerCallback = cb;
  }
  observe() {}
  disconnect() {}
}

function report(isIntersecting: boolean, top: number) {
  act(() => observerCallback!([{ isIntersecting, boundingClientRect: { top } as DOMRectReadOnly }]));
}

describe("CourseDetailSidebar — thanh mua mobile", () => {
  beforeEach(() => {
    observerCallback = null;
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("hiện khi thẻ giá còn ở dưới, ẩn khi thẻ đang hiện hoặc đã cuộn qua (vùng footer)", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <CourseDetailSidebar course={course} isEnrolled={false} progress={0} onEnroll={vi.fn()} onStartLearning={vi.fn()} onTrial={vi.fn()} />
      </QueryClientProvider>
    );

    report(false, 900); // thẻ giá còn ở phía dưới màn hình
    expect(screen.queryByTestId("mobile-buy-bar")).not.toBeNull();

    report(true, 200); // thẻ giá đang hiện
    expect(screen.queryByTestId("mobile-buy-bar")).toBeNull();

    report(false, -400); // đã cuộn qua thẻ giá, đang ở vùng footer
    expect(screen.queryByTestId("mobile-buy-bar")).toBeNull();
  });
});
