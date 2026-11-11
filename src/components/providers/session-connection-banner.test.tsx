import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionConnectionStore } from "@/lib/session-connection";
import { SessionConnectionBanner } from "./session-connection-banner";

// Review #114: 429 liên tiếp có thể chờ khoảng 3 phút; banner phải cho người dùng bỏ qua phần chờ.
describe("SessionConnectionBanner", () => {
  const onRetry = vi.fn();
  const onRetryNow = vi.fn();
  const renderBanner = () => render(<SessionConnectionBanner onRetry={onRetry} onRetryNow={onRetryNow} />);

  beforeEach(() => {
    onRetry.mockClear();
    onRetryNow.mockClear();
    useSessionConnectionStore.getState().markOk();
  });

  it("lượt chờ dài -> có nút Thử lại ngay, bấm thì bỏ phần chờ", () => {
    useSessionConnectionStore.getState().markRetrying(1, 31_000);
    renderBanner();

    fireEvent.click(screen.getByRole("button", { name: "Thử lại ngay" }));

    expect(onRetryNow).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("lượt chờ ngắn hoặc request đang chạy -> không có nút", () => {
    useSessionConnectionStore.getState().markRetrying(1, 2_000);
    const { rerender } = renderBanner();
    expect(screen.queryByRole("button", { name: "Thử lại ngay" })).toBeNull();

    useSessionConnectionStore.getState().markRetrying(1);
    rerender(<SessionConnectionBanner onRetry={onRetry} onRetryNow={onRetryNow} />);
    expect(screen.queryByRole("button", { name: "Thử lại ngay" })).toBeNull();
  });

  it("offline -> vẫn là nút Thử lại", () => {
    useSessionConnectionStore.getState().markOffline();
    renderBanner();

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Thử lại ngay" })).toBeNull();
  });
});
