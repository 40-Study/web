/**
 * QA7-A05 (tên đối tượng dài làm bảng nhật ký rộng ra, đẩy cột Kết quả / IP / Chi tiết ra khỏi khung) +
 * QA7-A06 (?page=9999 vượt trang cuối: danh sách rỗng, không có phân trang).
 */
import { render, screen } from "@testing-library/react";
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

let queryResult: Record<string, unknown>;
vi.mock("@/hooks/queries/use-audit-logs", () => ({
  useAuditLogs: () => queryResult,
  useAuditLogActions: () => ({ data: [] }),
}));

const LONG = "Đ".repeat(100);

function row(overrides: Partial<AuditLogItem> = {}): AuditLogItem {
  return {
    id: "l1",
    created_at: "2026-10-03T03:00:00Z",
    actor: { id: "a1", name: "Quản Trị Viên", email: "admin@40study.test" },
    action: "organization.update",
    target_type: "organization",
    target_id: "o1",
    status_code: 200,
    ip: "203.0.113.7",
    metadata: { target_name: LONG },
    ...overrides,
  };
}

function ok(items: AuditLogItem[], total: number, page = 1) {
  queryResult = { data: { items, total, page, page_size: 20 }, isLoading: false, isError: false, error: null, refetch: vi.fn() };
}

beforeEach(() => {
  replace.mockClear();
  search = "";
});

describe("AdminAuditLogsPage — QA7-A05 đối tượng dài", () => {
  it("ô Đối tượng bẻ chuỗi dài ở MỌI độ rộng (không còn sm:break-normal) và bị giới hạn bề ngang", () => {
    ok([row()], 1);
    render(<AdminAuditLogsPage />);

    const cell = screen.getByText(new RegExp(LONG)).closest("td")!;
    const tokens = cell.className.split(/\s+/);
    expect(tokens).toContain("[overflow-wrap:anywhere]");
    expect(tokens).toContain("max-w-xs");
    expect(tokens).not.toContain("sm:break-normal");
  });
});

describe("AdminAuditLogsPage — QA7-A06 trang vượt trang cuối", () => {
  it("?page=9999 với 612 dòng (31 trang) và danh sách rỗng -> replace sang trang cuối", () => {
    search = "action=user.lock&page=9999";
    ok([], 612, 9999);
    render(<AdminAuditLogsPage />);

    expect(replace).toHaveBeenCalledWith("/admin/audit-logs?action=user.lock&page=31", { scroll: false });
  });

  it("không có dòng nào (total=0) thì không đẩy về trang 0", () => {
    search = "page=4";
    ok([], 0, 4);
    render(<AdminAuditLogsPage />);

    expect(replace).not.toHaveBeenCalled();
  });
});
