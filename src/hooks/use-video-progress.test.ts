/**
 * Test hook heartbeat chống tua (contract §1).
 *
 * Trọng tâm là HAI trường hợp mutation — thứ mà test hàm thuần không chạm tới:
 *  1. Tua qua một đoạn dài: đoạn bị tua KHÔNG được tính vào `played_ranges`.
 *  2. Mất mạng khi gửi: khoảng đã gom phải được giữ lại và gửi kèm lần sau.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateProgress = vi.fn();

vi.mock("@/services/enrollment.service", () => ({
  enrollmentService: { updateProgress: (...args: unknown[]) => updateProgress(...args) },
}));

vi.mock("sonner", () => ({ toast: { warning: vi.fn(), error: vi.fn(), success: vi.fn() } }));

import { useVideoProgress } from "./use-video-progress";

/** Một lượt gửi mới nhất, đã lấy ra khỏi mock. */
function lastSentRanges(): [number, number][] {
  const calls = updateProgress.mock.calls;
  const payload = calls[calls.length - 1]?.[1] as { played_ranges: [number, number][] };
  return payload.played_ranges;
}

const PROGRESS_RESPONSE = {
  lesson_id: "l1",
  status: "in_progress",
  watched_seconds: 30,
  watched_pct: 5,
  last_position_seconds: 30,
  completed_at: null,
  next_lesson_unlocked: false,
} as const;

describe("useVideoProgress", () => {
  beforeEach(() => {
    updateProgress.mockReset();
    updateProgress.mockResolvedValue(PROGRESS_RESPONSE);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("gom khoảng phát liên tục rồi gửi theo nhịp 10 giây", async () => {
    const { result } = renderHook(() =>
      useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0 })
    );

    act(() => {
      result.current.handleTimeUpdate(0.25, 1, 600);
      result.current.handleTimeUpdate(0.5, 1, 600);
      result.current.handleTimeUpdate(0.75, 1, 600);
    });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    await waitFor(() => expect(updateProgress).toHaveBeenCalled());
    const [lessonId, payload] = updateProgress.mock.calls[0] as [string, Record<string, unknown>];
    expect(lessonId).toBe("l1");
    expect(payload.status).toBe("in_progress");
    expect(payload.duration_seconds).toBe(600);
    expect(payload.played_ranges).toEqual([[0, 1]]);
  });

  // Mutation case 1 — tua KHÔNG được tính là đã học.
  it("tua qua một đoạn dài: đoạn bị tua không nằm trong played_ranges", async () => {
    const { result } = renderHook(() =>
      useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0 })
    );

    act(() => {
      // 10 mẫu liên tục trong 2,5 giây đầu (tick 250ms).
      for (let i = 1; i <= 10; i += 1) {
        result.current.handleTimeUpdate(i * 0.25, 1, 600);
      }
      // Tua thẳng tới giây 540 — 537 giây nhảy qua.
      result.current.handleTimeUpdate(540, 1, 600);
      result.current.handleTimeUpdate(540.25, 1, 600);
    });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    await waitFor(() => expect(updateProgress).toHaveBeenCalled());
    const ranges = lastSentRanges();
    // Khoảng đầu chỉ tới ~2,5s; khoảng thứ hai bắt đầu từ 540s.
    expect(ranges[0][0]).toBe(0);
    expect(ranges[0][1]).toBeLessThan(5);
    // Đoạn 2,5s → 540s KHÔNG có trong bất kỳ khoảng nào.
    for (const [start, end] of ranges) {
      expect(start > 5 && end < 540).toBe(false);
    }
    expect(ranges[ranges.length - 1][0]).toBeGreaterThanOrEqual(539);
  });

  // Mutation case 2 — mất mạng không làm mất tiến độ.
  it("gửi thất bại: khoảng được giữ lại và gửi kèm lần heartbeat sau", async () => {
    updateProgress.mockRejectedValueOnce(new Error("offline"));

    const { result } = renderHook(() =>
      useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0 })
    );

    act(() => {
      result.current.handleTimeUpdate(0.25, 1, 600);
      result.current.handleTimeUpdate(0.5, 1, 600);
    });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });
    expect(updateProgress).toHaveBeenCalledTimes(1);

    // Mạng trở lại, thêm mẫu mới ở đoạn khác rồi chờ nhịp kế tiếp.
    updateProgress.mockResolvedValue(PROGRESS_RESPONSE);
    act(() => {
      result.current.handleTimeUpdate(120, 1, 600);
      result.current.handleTimeUpdate(120.25, 1, 600);
    });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    await waitFor(() => expect(updateProgress).toHaveBeenCalledTimes(2));
    const ranges = lastSentRanges();
    // Khoảng của lần gửi hỏng vẫn còn, gộp chung với khoảng mới.
    expect(ranges.some(([start]) => start <= 1)).toBe(true);
    expect(ranges.some(([start]) => start >= 119)).toBe(true);
  });

  it("đọc watched_pct / status từ response của server, không tự đặt completed", async () => {
    const onProgressChange = vi.fn();
    const { result } = renderHook(() =>
      useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0, onProgressChange })
    );

    act(() => {
      result.current.handleTimeUpdate(0.25, 1, 600);
    });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.progress).toEqual(PROGRESS_RESPONSE));
    expect(onProgressChange).toHaveBeenCalledWith(PROGRESS_RESPONSE);
    expect(result.current.progress?.status).toBe("in_progress");

    const [, payload] = updateProgress.mock.calls[0] as [string, Record<string, unknown>];
    expect(payload.status).toBe("in_progress");
    expect(payload).not.toHaveProperty("completed");
  });

  it("flushNow gửi ngay, không đợi hết nhịp 10 giây", async () => {
    const { result } = renderHook(() =>
      useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0 })
    );

    act(() => {
      result.current.handleTimeUpdate(0.25, 1, 600);
    });

    await act(async () => {
      result.current.flushNow();
      await Promise.resolve();
    });

    expect(updateProgress).toHaveBeenCalledTimes(1);
  });

  it("chưa biết duration thì không gửi request rỗng", async () => {
    renderHook(() => useVideoProgress({ lessonId: "l1", initialPositionSeconds: 0 }));

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    expect(updateProgress).not.toHaveBeenCalled();
  });

  it("đổi bài thì bộ gom được reset — khoảng bài cũ không gửi cho bài mới", async () => {
    const { result, rerender } = renderHook(
      ({ lessonId }: { lessonId: string }) => useVideoProgress({ lessonId }),
      { initialProps: { lessonId: "l1" } }
    );

    act(() => {
      result.current.handleTimeUpdate(0.25, 1, 600);
      result.current.handleTimeUpdate(0.5, 1, 600);
    });

    rerender({ lessonId: "l2" });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    expect(updateProgress).not.toHaveBeenCalled();
  });
});
