/**
 * QA2 F-10: hai nút trái tim ở course-hero không có onClick. WishlistButton là trái tim THẬT dùng cho thẻ khoá
 * học và trang chi tiết: bật/tắt qua /wishlist, cập nhật tức thì, khách bị đưa tới đăng nhập.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => "/courses",
}));
vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from "sonner";
import { WishlistButton } from "./wishlist-button";
import { useAuthStore } from "@/stores/auth.store";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

/** Backend giả có trạng thái: POST thêm, DELETE bớt — để lần tải lại sau khi bấm khớp với thực tế. */
function mockWishlist(initial: string[]) {
  const saved = new Set(initial);
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/wishlist/ids") return envelope({ course_ids: [...saved] });
    throw new Error(`GET không mong đợi: ${url}`);
  });
  mockApi.post.mockImplementation(async (_url: string, body: { course_id: string }) => {
    saved.add(body.course_id);
    return envelope({ id: "w1", course_id: body.course_id });
  });
  mockApi.delete.mockImplementation(async (url: string) => {
    saved.delete(url.split("/").pop() as string);
    return { data: { message: "ok" } };
  });
}

function signIn(role = "STUDENT") {
  useAuthStore.setState({ isAuthenticated: true, sessionStatus: "authenticated", activeRole: role } as never);
}

beforeEach(() => {
  resetMockApi();
  nav.push.mockClear();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
  useAuthStore.getState().clearServerSession();
});

const addLabel = "Thêm vào danh sách yêu thích";
const removeLabel = "Bỏ khỏi danh sách yêu thích";

describe("WishlistButton", () => {
  it("khách: bấm đưa tới đăng nhập kèm đường dẫn quay lại, không gọi API wishlist", () => {
    renderWithProviders(<WishlistButton courseId="c1" />);
    fireEvent.click(screen.getByRole("button", { name: addLabel }));

    expect(nav.push).toHaveBeenCalledWith("/login?redirect=%2Fcourses");
    expect(mockApi.post).not.toHaveBeenCalled();
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("học viên, khoá chưa lưu: bấm -> POST /wishlist và tim chuyển sang trạng thái đã lưu", async () => {
    signIn();
    mockWishlist([]);
    renderWithProviders(<WishlistButton courseId="c1" />);
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledWith("/wishlist/ids"));

    fireEvent.click(screen.getByRole("button", { name: addLabel }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith("/wishlist", { course_id: "c1" }));
    const pressed = await screen.findByRole("button", { name: removeLabel });
    expect(pressed.getAttribute("aria-pressed")).toBe("true");
    expect(toast.success).toHaveBeenCalledWith("Đã thêm vào yêu thích");
  });

  it("khoá đã lưu: tim hiện đã bấm; bấm lại -> DELETE /wishlist/:id", async () => {
    signIn();
    mockWishlist(["c1"]);
    renderWithProviders(<WishlistButton courseId="c1" />);

    const btn = await screen.findByRole("button", { name: removeLabel });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(btn);

    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith("/wishlist/c1"));
    expect(await screen.findByRole("button", { name: addLabel })).toBeTruthy();
    expect(toast.success).toHaveBeenCalledWith("Đã bỏ khỏi yêu thích");
  });

  it("API lỗi: trả tim về trạng thái cũ và báo lỗi, không nói đã lưu", async () => {
    signIn();
    mockWishlist([]);
    mockApi.post.mockRejectedValue(new Error("boom"));
    renderWithProviders(<WishlistButton courseId="c1" />);
    await waitFor(() => expect(mockApi.get).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: addLabel }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("button", { name: addLabel })).toBeTruthy();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("nằm trong thẻ có link: bấm tim KHÔNG kích hoạt link (preventDefault) ", async () => {
    signIn();
    mockWishlist([]);
    renderWithProviders(
      <a href="/courses/x">
        <WishlistButton courseId="c1" />
      </a>,
    );
    await waitFor(() => expect(mockApi.get).toHaveBeenCalled());

    const notPrevented = fireEvent.click(screen.getByRole("button", { name: addLabel }));
    expect(notPrevented).toBe(false); // false = preventDefault đã được gọi
  });

  it("phụ huynh/admin không dùng wishlist: không hiện tim", () => {
    signIn("PARENT");
    mockWishlist([]);
    const { container } = renderWithProviders(<WishlistButton courseId="c1" />);
    expect(container.querySelector("button")).toBeNull();
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("variant 'button' có chữ để người dùng biết nút làm gì", async () => {
    signIn();
    mockWishlist(["c1"]);
    renderWithProviders(<WishlistButton courseId="c1" variant="button" />);
    expect(await screen.findByText("Đã lưu yêu thích")).toBeTruthy();
  });
});
