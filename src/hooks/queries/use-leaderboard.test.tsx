import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { leaderboardService } from "@/services/leaderboard.service";
import { useAuthStore } from "@/stores/auth.store";
import { useMyClassBoards, useMyRank } from "./use-leaderboard";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// Trang xếp hạng mở công khai: khách gọi /leaderboard/classes và /leaderboard/me chỉ nhận 401 thừa.
describe("hook bảng xếp hạng cá nhân — không gọi API khi là khách", () => {
  afterEach(() => {
    useAuthStore.getState().clearServerSession();
    vi.restoreAllMocks();
  });

  it("khách: useMyClassBoards và useMyRank không gọi API", async () => {
    useAuthStore.setState({ isAuthenticated: false, sessionStatus: "anonymous" });
    const boards = vi.spyOn(leaderboardService, "getMyClassBoards").mockResolvedValue([]);
    const rank = vi.spyOn(leaderboardService, "getMyRank").mockResolvedValue(undefined as never);

    renderHook(() => ({ a: useMyClassBoards(), b: useMyRank({ period_type: "weekly" }) }), { wrapper });
    await new Promise((r) => setTimeout(r, 20));

    expect(boards).not.toHaveBeenCalled();
    expect(rank).not.toHaveBeenCalled();
  });

  it("đã đăng nhập: gọi API như cũ", async () => {
    useAuthStore.setState({ isAuthenticated: true, sessionStatus: "authenticated" });
    const boards = vi.spyOn(leaderboardService, "getMyClassBoards").mockResolvedValue([]);
    const rank = vi.spyOn(leaderboardService, "getMyRank").mockResolvedValue(undefined as never);

    renderHook(() => ({ a: useMyClassBoards(), b: useMyRank({ period_type: "weekly" }) }), { wrapper });

    await waitFor(() => expect(boards).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(rank).toHaveBeenCalledTimes(1));
  });
});
