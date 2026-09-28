/**
 * Review m1: trong 30 giây ân hạn (phase ENDED, chưa tới end_time + 30s) bảng xếp hạng KHÔNG được
 * gọi API (sẽ nhận 403) và câu chữ không được nói "sau khi cuộc thi kết thúc". Qua mốc thì tự bật.
 */
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const leaderboardMock = vi.fn();
vi.mock("@/hooks/queries/use-contests", () => ({
  useContestLeaderboard: (...args: unknown[]) => leaderboardMock(...args),
}));

import { ContestLeaderboard } from "./contest-leaderboard";

const END = "2026-09-29T10:00:00Z";

beforeEach(() => {
  leaderboardMock.mockReset();
  leaderboardMock.mockReturnValue({ isLoading: false, error: null, data: { items: [], total_pages: 1, page: 1, finalized: false }, refetch: vi.fn() });
});
afterEach(() => vi.useRealTimers());

function renderAt(serverTime: string, phase: "ACTIVE" | "ENDED" | "FINALIZED" = "ENDED") {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(serverTime));
  return render(<ContestLeaderboard contestId="c1" phase={phase} endTime={END} serverTime={serverTime} receivedAt={Date.parse(serverTime)} />);
}

describe("ContestLeaderboard — ân hạn 30 giây", () => {
  it("ENDED, mới qua end_time 10 giây -> chưa gọi API, báo đang chờ hết giờ nộp kèm đếm ngược", () => {
    renderAt("2026-09-29T10:00:10Z");
    expect(leaderboardMock).toHaveBeenLastCalledWith("c1", 1, false);
    const text = screen.getByRole("status").textContent ?? "";
    expect(text).toContain("đang chờ hết thời gian nộp bài");
    expect(text).toContain("00:00:20");
    expect(text).not.toContain("sau khi cuộc thi kết thúc");
  });

  it("qua mốc end_time + 30s trong lúc đang mở trang -> tự bật truy vấn, không cần tải lại", async () => {
    renderAt("2026-09-29T10:00:25Z");
    expect(leaderboardMock).toHaveBeenLastCalledWith("c1", 1, false);
    await vi.advanceTimersByTimeAsync(6_000);
    expect(leaderboardMock).toHaveBeenLastCalledWith("c1", 1, true);
  });

  it("ACTIVE -> ẩn, ghi giờ công bố cụ thể", () => {
    renderAt("2026-09-29T09:00:00Z", "ACTIVE");
    expect(leaderboardMock).toHaveBeenLastCalledWith("c1", 1, false);
    expect(screen.getByRole("status").textContent).toContain("17:00:30 29/09/2026");
  });

  it("FINALIZED -> luôn hiện", () => {
    renderAt("2026-09-29T10:00:05Z", "FINALIZED");
    expect(leaderboardMock).toHaveBeenLastCalledWith("c1", 1, true);
  });
});
