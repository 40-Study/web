/**
 * QA vòng 2 (S1): header từng hiện "Giỏ hàng (0)" dù giỏ có 2 khóa. Nguyên nhân cũ là build cũ đọc
 * `item_count`; backend (CartListResponseDTO.TotalItem) trả `total_item`. Khóa hợp đồng đó: badge và
 * tiêu đề dropdown phải theo `total_item` của GET /cart.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { CartDropdown } from "./cart-dropdown";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import { useAuthStore } from "@/stores/auth.store";

const item = (id: string) => ({
  id: `ci-${id}`,
  course_id: id,
  course: { id, title: `Khóa ${id}`, slug: `khoa-${id}`, price: 100000 },
});

beforeEach(() => {
  resetMockApi();
  useAuthStore.setState({ isAuthenticated: true });
});

describe("CartDropdown — số lượng theo total_item", () => {
  it("giỏ 2 khóa: badge hiện 2 và tiêu đề dropdown là 'Giỏ hàng (2)'", async () => {
    mockApi.get.mockResolvedValue(envelope({ items: [item("a"), item("b")], total: 200000, total_item: 2 }));
    renderWithProviders(<CartDropdown />);

    await waitFor(() => expect(screen.getByText("2")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Giỏ hàng" }));
    expect(screen.getByText("Giỏ hàng (2)")).toBeTruthy();
  });
});
