/**
 * QueryState: 4 trạng thái chuẩn (loading / lỗi / rỗng / có dữ liệu) + Q10 (STU-01, T-03, PG-01, ADMIN-01):
 * refetch nền lỗi nhưng đã có dữ liệu thì GIỮ dữ liệu, báo gọn phía trên kèm "Thử lại", không thay bằng hộp lỗi.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryState } from "./query-state";

const content = <p>Nội dung danh sách</p>;

describe("QueryState — 4 trạng thái", () => {
  it("loading: skeleton + nhãn 'Đang tải dữ liệu…', không hiện nội dung", () => {
    render(<QueryState isLoading>{content}</QueryState>);
    expect(screen.getByText("Đang tải dữ liệu…")).toBeTruthy();
    expect(screen.queryByText("Nội dung danh sách")).toBeNull();
  });

  it("lỗi (chưa có dữ liệu): hộp lỗi role=alert + 'Thử lại', không hiện nội dung", () => {
    const onRetry = vi.fn();
    render(
      <QueryState isError onRetry={onRetry}>
        {content}
      </QueryState>
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText("Nội dung danh sách")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("rỗng: tiêu đề + mô tả, không hiện nội dung", () => {
    render(
      <QueryState isEmpty emptyTitle="Chưa có gì" emptyDescription="Thêm mục đầu tiên.">
        {content}
      </QueryState>
    );
    expect(screen.getByText("Chưa có gì")).toBeTruthy();
    expect(screen.getByText("Thêm mục đầu tiên.")).toBeTruthy();
    expect(screen.queryByText("Nội dung danh sách")).toBeNull();
  });

  it("có dữ liệu: chỉ nội dung, không thông báo nào", () => {
    render(<QueryState hasData>{content}</QueryState>);
    expect(screen.getByText("Nội dung danh sách")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("QueryState — hasData: refetch nền lỗi giữ dữ liệu (Q10-STU-01 / T-03 / PG-01 / ADMIN-01)", () => {
  it("isError + hasData: nội dung còn nguyên, thông báo gọn role=status có 'Thử lại', KHÔNG có hộp lỗi", () => {
    const onRetry = vi.fn();
    render(
      <QueryState isError hasData onRetry={onRetry}>
        {content}
      </QueryState>
    );
    expect(screen.getByText("Nội dung danh sách")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Không cập nhật được dữ liệu mới");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("isError + hasData nhưng không có onRetry: vẫn báo, không có nút", () => {
    render(
      <QueryState isError hasData>
        {content}
      </QueryState>
    );
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
  });

  it("isError mà KHÔNG truyền hasData (mặc định false): vẫn là hộp lỗi đầy đủ như trước", () => {
    render(
      <QueryState isError onRetry={() => {}}>
        {content}
      </QueryState>
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.queryByText("Nội dung danh sách")).toBeNull();
  });

  it("hasData chỉ có tác dụng khi lỗi: không lỗi thì không có thông báo", () => {
    render(
      <QueryState hasData onRetry={() => {}}>
        {content}
      </QueryState>
    );
    expect(screen.queryByRole("status")).toBeNull();
  });
});
