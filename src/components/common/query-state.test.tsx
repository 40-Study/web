import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryState } from "./query-state";

describe("QueryState", () => {
  it("renders loading skeleton when isLoading is true", () => {
    render(
      <QueryState isLoading>
        <p>nội dung</p>
      </QueryState>
    );
    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.queryByText("nội dung")).toBeNull();
  });

  it("renders error message and calls onRetry when isError is true", () => {
    const onRetry = vi.fn();
    render(
      <QueryState isError error={new Error("Lỗi mạng")} onRetry={onRetry}>
        <p>nội dung</p>
      </QueryState>
    );
    expect(screen.getByText("Lỗi mạng")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when isEmpty is true", () => {
    render(
      <QueryState isEmpty emptyTitle="Trống trơn">
        <p>nội dung</p>
      </QueryState>
    );
    expect(screen.getByText("Trống trơn")).toBeDefined();
    expect(screen.queryByText("nội dung")).toBeNull();
  });

  it("renders children when data is loaded, not errored, and not empty", () => {
    render(
      <QueryState isLoading={false} isError={false} isEmpty={false}>
        <p>nội dung</p>
      </QueryState>
    );
    expect(screen.getByText("nội dung")).toBeDefined();
  });
});
