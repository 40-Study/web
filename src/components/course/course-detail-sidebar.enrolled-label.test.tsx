/**
 * QA3 Q17: vừa đăng ký khoá miễn phí (0%) nút phải là "Bắt đầu học", không phải "Tiếp tục học".
 */
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { CourseDetailSidebar } from "./course-detail-sidebar";
import type { CourseDetail } from "@/types/course";

vi.mock("@/services/order.service", () => ({
  orderService: { createOrder: vi.fn(), createPaymentIntent: vi.fn(), getPaymentStatus: vi.fn(), checkPayment: vi.fn(), cancelOrder: vi.fn() },
}));
vi.mock("@/services/cart.service", () => ({
  cartService: {
    getCart: vi.fn().mockResolvedValue({ items: [], total: 0, total_item: 0 }),
    addToCart: vi.fn(), isInCart: vi.fn().mockResolvedValue(false), removeFromCart: vi.fn(), clearCart: vi.fn(),
  },
}));

const course = {
  id: "c1", createdAt: "", updatedAt: "", title: "Hình học", slug: "hinh-hoc", description: "", thumbnail: "",
  price: 0, rating: 0, reviewCount: 0, studentCount: 0, instructor: { id: "i", name: "GV" },
  category: { id: "k", name: "Toán", slug: "toan" }, level: "beginner", language: "vi", duration: 10, lessonCount: 1,
  learningOutcomes: [], sections: [], reviews: [], ratingDistribution: {},
} as unknown as CourseDetail;

function renderSidebar(progress: number) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CourseDetailSidebar course={course} isEnrolled progress={progress} onEnroll={vi.fn()} onStartLearning={vi.fn()} onTrial={vi.fn()} />
    </QueryClientProvider>
  );
}

describe("CourseDetailSidebar — nhãn nút theo tiến độ (Q17)", () => {
  it("0% -> 'Bắt đầu học'", () => {
    renderSidebar(0);
    expect(screen.getByRole("button", { name: "Bắt đầu học" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Tiếp tục học" })).toBeNull();
  });
  it("đã có tiến độ -> 'Tiếp tục học'", () => {
    renderSidebar(35);
    expect(screen.getByRole("button", { name: "Tiếp tục học" })).toBeTruthy();
  });
});
