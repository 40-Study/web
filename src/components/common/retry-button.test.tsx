/**
 * L7 (review #139): sau lỗi `isLoading` vẫn false trong lúc refetch, nên bấm "Thử lại" trông như không có gì xảy ra.
 * Nút phải khoá và đổi nhãn tới khi refetch xong.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChildSectionError } from "@/components/parent/child-section-error";
import { QueryState } from "./query-state";
import { RetryButton } from "./retry-button";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("RetryButton", () => {
  it("khoá + đổi nhãn khi refetch đang chạy, bấm lần nữa không gọi thêm, xong thì mở lại", async () => {
    const d = deferred();
    const onRetry = vi.fn(() => d.promise);
    render(<RetryButton onRetry={onRetry} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    });
    const busy = screen.getByRole("button", { name: "Đang tải lại…" }) as HTMLButtonElement;
    expect(busy.disabled).toBe(true);
    fireEvent.click(busy);
    expect(onRetry).toHaveBeenCalledTimes(1);

    await act(async () => {
      d.resolve();
      await d.promise;
    });
    expect((screen.getByRole("button", { name: "Thử lại" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("refetch reject vẫn mở lại nút", async () => {
    render(<RetryButton onRetry={() => Promise.reject(new Error("x"))} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    });
    expect((screen.getByRole("button", { name: "Thử lại" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("QueryState và ChildSectionError (cả compact) dùng cùng nút bận", async () => {
    for (const ui of [
      <QueryState key="q" isError onRetry={() => new Promise(() => {})}>{null}</QueryState>,
      <ChildSectionError key="c" label="điểm số" onRetry={() => new Promise(() => {})} />,
      <ChildSectionError key="k" compact label="điểm số" onRetry={() => new Promise(() => {})} />,
    ]) {
      const { unmount } = render(ui);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
      });
      expect((screen.getByRole("button", { name: "Đang tải lại…" }) as HTMLButtonElement).disabled).toBe(true);
      unmount();
    }
  });
});
