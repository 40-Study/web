/**
 * Ô "Mã giảm giá" ở sidebar trang khoá học (cùng lớp lỗi A-05 với dialog Mua ngay, review R1 MINOR 4): không
 * truyền subtotal nên voucher có đơn tối thiểu luôn bị từ chối, và kết quả áp bị bỏ (`onApplied={() => {}}`).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CourseDetailSidebar } from "./course-detail-sidebar";
import { useAuthStore } from "@/stores/auth.store";
import { voucherService, type Voucher } from "@/services/voucher.service";
import type { CourseDetail } from "@/types/course";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));
vi.mock("@/services/cart.service", () => ({
  cartService: {
    getCart: vi.fn().mockResolvedValue({ items: [], total: 0, item_count: 0 }),
    addToCart: vi.fn(),
    isInCart: vi.fn().mockResolvedValue(false),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
  },
}));

// Giống SUMMER50K trong QA: giảm 50.000đ, đơn tối thiểu 300.000đ.
const summer50k: Voucher = {
  id: "v1",
  code: "SUMMER50K",
  name: "Summer",
  discount_unit: "MONEY",
  discount_method: "FIXED",
  discount_amount_money: 50000,
  min_purchase_money: 300000,
  is_active: true,
};

const course = {
  id: "course-1",
  title: "Python cho khoa học dữ liệu",
  slug: "python",
  thumbnail: "https://example.com/t.jpg",
  price: 699000,
  instructor: { id: "i", name: "GV" },
  duration: 60,
  lessonCount: 3,
  sections: [],
} as unknown as CourseDetail;

function renderSidebar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CourseDetailSidebar
        course={course}
        isEnrolled={false}
        progress={0}
        onEnroll={vi.fn()}
        onStartLearning={vi.fn()}
        onTrial={vi.fn()}
      />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(voucherService, "getVoucherByCode").mockResolvedValue(summer50k);
  useAuthStore.getState().setSessionStatus("authenticated");
});

async function applyInSidebar() {
  fireEvent.change(screen.getByPlaceholderText("Nhập mã voucher"), { target: { value: "SUMMER50K" } });
  fireEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
  await waitFor(() => expect(screen.getByLabelText("Xóa voucher")).toBeTruthy());
}

describe("CourseDetailSidebar — ô Mã giảm giá", () => {
  it("voucher có đơn tối thiểu 300.000đ áp được cho khoá 699.000đ (không bị từ chối vì subtotal=0)", async () => {
    renderSidebar();
    await applyInSidebar();

    expect(screen.queryByText(/tối thiểu/)).toBeNull();
    expect(screen.getByText(/Giảm 50\.000/)).toBeTruthy();
  });

  it("voucher đã áp ở sidebar được mang vào dialog Mua ngay, tổng thanh toán đã trừ", async () => {
    renderSidebar();
    await applyInSidebar();

    fireEvent.click(screen.getByRole("button", { name: "Mua ngay" }));

    // Dialog tự áp lại mã: bảng giá trừ 50.000 và nút thanh toán hiện 649.000.
    await screen.findByText(/- 50\.000/);
    expect(screen.getByRole("button", { name: /Thanh toán 649\.000/ })).toBeTruthy();
  });
});