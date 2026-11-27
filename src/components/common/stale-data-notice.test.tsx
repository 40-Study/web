/**
 * StaleDataNotice là component DUY NHẤT cho ca "refetch nền lỗi mà còn dữ liệu cũ" (Q10 #148 M2), và vùng
 * `role="status"` phải mount TRƯỚC chữ để trình đọc màn hình đọc ra (L4).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StaleDataNotice } from "./stale-data-notice";

describe("StaleDataNotice", () => {
  it("câu mặc định, resourceLabel và message ghi đè", () => {
    const { rerender } = render(<StaleDataNotice />);
    expect(screen.getByRole("status").textContent).toContain("Không cập nhật được dữ liệu mới. Đang hiển thị dữ liệu cũ.");
    rerender(<StaleDataNotice resourceLabel="giỏ hàng" />);
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được giỏ hàng, đang hiện dữ liệu đã tải trước đó.");
    rerender(<StaleDataNotice resourceLabel="giỏ hàng" message="Nút thanh toán tạm khoá." />);
    expect(screen.getByRole("status").textContent).toBe("Nút thanh toán tạm khoá.");
  });

  it("vùng role=status được render TRƯỚC chữ: lượt render đầu (chưa chạy effect) chỉ có vùng rỗng, chữ chèn vào sau mount", () => {
    // renderToString = đúng lượt render đầu (không chạy effect): vùng live đã có, chữ chưa có.
    const first = renderToString(<StaleDataNotice resourceLabel="danh sách" onRetry={() => undefined} />);
    expect(first).toContain('role="status"');
    expect(first).toContain('aria-live="polite"');
    expect(first).not.toContain("Không làm mới được");
    expect(first).not.toContain("Thử lại");
    // Sau mount (effect đã chạy) chữ nằm TRONG vùng đó.
    render(<StaleDataNotice resourceLabel="danh sách" onRetry={() => undefined} />);
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Không làm mới được danh sách");
    expect(status.getAttribute("aria-atomic")).toBe("true");
  });

  it("nút 'Thử lại' gọi onRetry và hiện trạng thái bận khi onRetry trả Promise (L3)", async () => {
    let resolve: () => void = () => {};
    const onRetry = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(<StaleDataNotice onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Đang tải lại…" }).getAttribute("aria-busy")).toBe("true");
    await act(async () => resolve());
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
  });

  it("không có onRetry thì không có nút; id để nút khác trỏ aria-describedby", () => {
    render(<StaleDataNotice id="why" message="x" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("status").id).toBe("why");
  });
});
