/**
 * A-01 (QA3 261104): người đã đăng nhập mở /login vẫn thấy form đăng nhập. Phải về trang chủ của vai trò.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";

const replace = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => searchParams,
}));
vi.mock("@/hooks/queries/use-auth", () => ({ useLogin: () => ({ mutate: vi.fn(), isPending: false }) }));
const bootstrapAuthSession = vi.fn();
vi.mock("@/components/providers/auth-session", () => ({ bootstrapAuthSession: () => bootstrapAuthSession() }));

import LoginPage from "./page";
import { savePendingCartIntent } from "@/lib/pending-cart-intent";

beforeEach(() => {
  replace.mockReset();
  searchParams = new URLSearchParams();
  window.sessionStorage.clear();
  bootstrapAuthSession.mockReset().mockResolvedValue("authenticated");
});

describe("LoginPage — đã đăng nhập", () => {
  it("phụ huynh đã đăng nhập: chuyển về /home và không vẽ form", async () => {
    useAuthStore.setState({ sessionStatus: "authenticated", isAuthenticated: true, activeRole: "PARENT" });
    render(<LoginPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/home"));
    expect(screen.queryByLabelText("Email")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Đang kiểm tra phiên đăng nhập");
  });

  it("giảng viên đã đăng nhập: về trang chủ giảng viên", async () => {
    useAuthStore.setState({ sessionStatus: "authenticated", isAuthenticated: true, activeRole: "TEACHER" });
    render(<LoginPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/teacher/schedule"));
  });

  // UX-A-07: cookie đã hết nhưng store còn "authenticated" -> server từ chối -> hiện form, giữ redirect gốc.
  it("phiên cũ bị server từ chối: hiện form, không đẩy về trang chủ vai trò, giữ redirect", async () => {
    searchParams = new URLSearchParams({ redirect: "/certificates" });
    bootstrapAuthSession.mockImplementation(async () => {
      useAuthStore.setState({ sessionStatus: "anonymous", isAuthenticated: false });
      return "anonymous";
    });
    useAuthStore.setState({ sessionStatus: "authenticated", isAuthenticated: true, activeRole: "STUDENT" });
    render(<LoginPage />);

    await waitFor(() => expect(screen.getByLabelText("Email")).toBeTruthy());
    expect(replace).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("auth_redirect")).toBe("/certificates");
  });
});

// UX-A-03: khách vừa bấm "Thêm vào giỏ" -> trang login nói rõ lý do.
describe("LoginPage — đăng nhập để thêm giỏ", () => {
  it("redirect về đúng trang khoá có ý định thêm giỏ: hiện 'Đăng nhập để thêm vào giỏ'", async () => {
    savePendingCartIntent("course-1", "python-co-ban");
    searchParams = new URLSearchParams({ redirect: "/courses/python-co-ban" });
    useAuthStore.setState({ sessionStatus: "anonymous", isAuthenticated: false, activeRole: null });
    render(<LoginPage />);
    await waitFor(() => expect(screen.getByText("Đăng nhập để thêm vào giỏ")).toBeTruthy());
  });

  it("không có ý định: giữ câu chào thường", () => {
    useAuthStore.setState({ sessionStatus: "anonymous", isAuthenticated: false, activeRole: null });
    render(<LoginPage />);
    expect(screen.getByText("Chào mừng bạn quay trở lại")).toBeTruthy();
  });

  it("khách: vẫn thấy form", () => {
    useAuthStore.setState({ sessionStatus: "anonymous", isAuthenticated: false, activeRole: null });
    render(<LoginPage />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email")).toBeTruthy();
  });
});
