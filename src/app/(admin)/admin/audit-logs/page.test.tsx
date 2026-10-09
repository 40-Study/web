/**
 * Trang Nhật ký hoạt động (contract C2): bảng thật từ API, bộ lọc nằm trên URL, đủ trạng thái
 * loading/lỗi/rỗng, và KHÔNG còn banner "chưa ghi nhận" của bản stub.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuditLogItem } from "@/services/audit-log.service";
import AdminAuditLogsPage from "./page";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/admin/audit-logs",
  useSearchParams: () => new URLSearchParams(search),
}));

function log(overrides: Partial<AuditLogItem>): AuditLogItem {
  return {
    id: "l1",
    created_at: "2026-10-03T03:00:00Z",
    actor: { id: "a1", name: "Quản Trị Viên", email: "admin@40study.test" },
    action: "user.lock",
    target_type: "user",
    target_id: "u-123",
    status_code: 200,
    ip: "203.0.113.7",
    metadata: null,
    ...overrides,
  };
}

let queryResult: Record<string, unknown>;
const useAuditLogs = vi.fn((params: unknown) => {
  void params;
  return queryResult;
});
vi.mock("@/hooks/queries/use-audit-logs", () => ({
  useAuditLogs: (params: unknown) => useAuditLogs(params),
  useAuditLogActions: () => ({ data: ["user.lock", "course.approve"] }),
}));

function ok(items: AuditLogItem[], total = items.length) {
  queryResult = {
    data: { items, total, page: 1, page_size: 20 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
}

beforeEach(() => {
  replace.mockClear();
  useAuditLogs.mockClear();
  search = "";
  ok([]);
});

describe("AdminAuditLogsPage", () => {
  it("hiện dòng nhật ký thật: người thao tác, nhãn hành động, đối tượng, IP — và bỏ banner stub", () => {
    ok([
      log({}),
      log({ id: "l2", action: "future.action", actor: null, target_type: "", target_id: null, ip: null }),
    ]);
    render(<AdminAuditLogsPage />);

    const row = screen.getByText("Quản Trị Viên").closest("tr")!;
    expect(within(row).getByText("admin@40study.test")).toBeTruthy();
    expect(within(row).getByText("Khóa tài khoản")).toBeTruthy();
    expect(within(row).getByText("user: u-123")).toBeTruthy();
    expect(within(row).getByText("203.0.113.7")).toBeTruthy();
    expect(within(row).getByText("10:00 03/10/2026")).toBeTruthy(); // giờ Việt Nam

    const unknown = screen.getByText("future.action").closest("tr")!; // mã lạ hiện nguyên mã
    expect(within(unknown).getByText("Tài khoản không còn")).toBeTruthy();
    expect(screen.queryByText(/chưa ghi nhận nhật ký/i)).toBeNull();
  });

  it("metadata chỉ mở khi bấm Chi tiết và hiện dạng văn bản (không render HTML)", () => {
    ok([log({ metadata: { old: "0", new: "10", note: "<img src=x onerror=alert(1)>" } })]);
    const { container } = render(<AdminAuditLogsPage />);
    expect(screen.queryByText(/"old"/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Chi tiết" }));
    expect(screen.getByText(/"new": "10"/)).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Ẩn chi tiết" }));
    expect(screen.queryByText(/"old"/)).toBeNull();
  });

  it("dòng không có metadata thì không có nút Chi tiết", () => {
    ok([log({ metadata: null })]);
    render(<AdminAuditLogsPage />);
    expect(screen.queryByRole("button", { name: "Chi tiết" })).toBeNull();
  });

  it("rỗng, đang tải và lỗi đều có trạng thái riêng", () => {
    ok([]);
    const { unmount } = render(<AdminAuditLogsPage />);
    expect(screen.getByText("Chưa có nhật ký hoạt động nào")).toBeTruthy();
    unmount();

    queryResult = { data: undefined, isLoading: true, isError: false, error: null, refetch: vi.fn() };
    const loading = render(<AdminAuditLogsPage />);
    expect(screen.queryByText("Chưa có nhật ký hoạt động nào")).toBeNull();
    loading.unmount();

    queryResult = { data: undefined, isLoading: false, isError: true, error: new Error("boom"), refetch: vi.fn() };
    render(<AdminAuditLogsPage />);
    expect(screen.queryByText("Chưa có nhật ký hoạt động nào")).toBeNull();
    expect(screen.getByRole("button", { name: /thử lại/i })).toBeTruthy();
  });

  it("bộ lọc đọc từ URL và truyền xuống query", () => {
    search = "action=course.approve&actor_id=a1&from=2026-10-01&to=2026-10-05&page=3";
    ok([log({})], 100);
    render(<AdminAuditLogsPage />);
    expect(useAuditLogs).toHaveBeenLastCalledWith({
      page: 3, page_size: 20, action: "course.approve", actor_id: "a1", from: "2026-10-01", to: "2026-10-05",
    });
    expect((screen.getByLabelText("Lọc theo hành động") as HTMLSelectElement).value).toBe("course.approve");
    expect((screen.getByLabelText("Từ ngày") as HTMLInputElement).value).toBe("2026-10-01");
  });

  it("đổi bộ lọc ghi lên URL và về trang 1; chọn Tất cả xoá tham số", () => {
    search = "page=4&action=user.lock";
    ok([log({})], 100);
    render(<AdminAuditLogsPage />);

    fireEvent.change(screen.getByLabelText("Lọc theo hành động"), { target: { value: "course.approve" } });
    expect(replace).toHaveBeenLastCalledWith("/admin/audit-logs?action=course.approve", { scroll: false });

    fireEvent.change(screen.getByLabelText("Lọc theo hành động"), { target: { value: "" } });
    expect(replace).toHaveBeenLastCalledWith("/admin/audit-logs", { scroll: false });

    fireEvent.change(screen.getByLabelText("Từ ngày"), { target: { value: "2026-10-02" } });
    expect(replace).toHaveBeenLastCalledWith("/admin/audit-logs?action=user.lock&from=2026-10-02", { scroll: false });
  });

  it("phân trang: chỉ hiện khi nhiều trang, Sau/Trước đổi ?page=", () => {
    ok([log({})], 20);
    const { unmount } = render(<AdminAuditLogsPage />);
    expect(screen.queryByRole("button", { name: "Sau" })).toBeNull();
    unmount();

    search = "page=2";
    ok([log({})], 45); // 3 trang
    render(<AdminAuditLogsPage />);
    expect(screen.getByText(/Trang 2\/3/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sau" }));
    expect(replace).toHaveBeenLastCalledWith("/admin/audit-logs?page=3", { scroll: false });
    fireEvent.click(screen.getByRole("button", { name: "Trước" }));
    expect(replace).toHaveBeenLastCalledWith("/admin/audit-logs", { scroll: false });
  });
});
