/**
 * L4: useCoinWallet() từng gọi API ví xu với MỌI vai đã đăng nhập, kể cả phụ huynh (không có ví,
 * header đã ẩn số dư nhưng request vẫn bắn). Giờ chỉ bật khi vai ĐANG DÙNG được vào /coins
 * (cùng bảng ROLE_SCOPED_ROUTES với menu và route guard).
 */

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type AuthState = { isAuthenticated: boolean; activeRole: string | null };
let authState: AuthState;

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: AuthState) => unknown) => selector(authState),
}));
const getWallet = vi.fn();
vi.mock("@/services/coin.service", () => ({ coinService: { getWallet: (...a: unknown[]) => getWallet(...a) } }));

// eslint-disable-next-line import/first
import { useCoinWallet } from "./use-coins";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useCoinWallet — chỉ gọi API với vai được dùng ví", () => {
  beforeEach(() => {
    getWallet.mockReset();
    getWallet.mockResolvedValue({ balance: 5 });
  });

  it("học viên: gọi API ví", async () => {
    authState = { isAuthenticated: true, activeRole: "STUDENT" };
    const { result } = renderHook(() => useCoinWallet(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ balance: 5 }));
    expect(getWallet).toHaveBeenCalledTimes(1);
  });

  it.each(["PARENT", "SYSTEM_ADMIN", "ADMIN", "ORG_OWNER"])("%s: KHÔNG gọi API ví", async (role) => {
    authState = { isAuthenticated: true, activeRole: role };
    const { result } = renderHook(() => useCoinWallet(), { wrapper });
    // không có request nào để chờ: query bị tắt hẳn chứ không chỉ chưa xong
    expect(result.current.fetchStatus).toBe("idle");
    expect(getWallet).not.toHaveBeenCalled();
  });

  it("chưa đăng nhập: KHÔNG gọi API ví", () => {
    authState = { isAuthenticated: false, activeRole: null };
    renderHook(() => useCoinWallet(), { wrapper });
    expect(getWallet).not.toHaveBeenCalled();
  });
});
