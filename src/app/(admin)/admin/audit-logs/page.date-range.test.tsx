/**
 * ADM-L8 (QA2 261013): chọn Từ ngày rồi Đến ngày nhỏ hơn thì
 *  (1) Từ ngày bị rơi khỏi URL — `updateQuery` dựng query từ `searchParams` của lần render trước nên
 *      hai thay đổi liên tiếp (chưa kịp render lại) ghi đè nhau;
 *  (2) bảng im lặng báo "không có thao tác" thay vì nói khoảng ngày sai.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({
  replace: vi.fn(),
  // Giữ nguyên MỘT đối tượng như Next (useSearchParams ổn định tới khi URL đổi).
  params: new URLSearchParams(),
}));
const service = vi.hoisted(() => ({ list: vi.fn(), actions: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => "/admin/audit-logs",
  useSearchParams: () => nav.params,
}));
vi.mock("@/services/audit-log.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/audit-log.service")>()),
  auditLogService: service,
}));

import AdminAuditLogsPage from "./page";

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AdminAuditLogsPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  nav.replace.mockReset();
  nav.params = new URLSearchParams();
  service.list.mockReset().mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20 });
  service.actions.mockReset().mockResolvedValue([]);
});

describe("audit-logs — bộ lọc ngày", () => {
  it("đổi Từ ngày rồi Đến ngày liên tiếp: URL cuối cùng giữ CẢ HAI", async () => {
    renderPage();
    fireEvent.change(await screen.findByLabelText("Từ ngày"), { target: { value: "2026-12-01" } });
    fireEvent.change(screen.getByLabelText("Đến ngày"), { target: { value: "2026-01-01" } });

    const lastUrl = String(nav.replace.mock.calls.at(-1)?.[0]);
    const query = new URLSearchParams(lastUrl.split("?")[1]);
    expect(query.get("from")).toBe("2026-12-01");
    expect(query.get("to")).toBe("2026-01-01");
  });

  it("Từ ngày > Đến ngày: báo lỗi khoảng ngày và KHÔNG gọi API", async () => {
    nav.params = new URLSearchParams("from=2026-12-01&to=2026-01-01");
    renderPage();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/Từ ngày phải trước hoặc cùng ngày với Đến ngày/);
    await waitFor(() => expect(service.actions).toHaveBeenCalled());
    expect(service.list).not.toHaveBeenCalled();
  });

  it("khoảng ngày hợp lệ: không báo lỗi và gọi API với from/to", async () => {
    nav.params = new URLSearchParams("from=2026-01-01&to=2026-12-01");
    renderPage();

    await waitFor(() => expect(service.list).toHaveBeenCalled());
    expect(service.list.mock.calls[0]?.[0]).toMatchObject({ from: "2026-01-01", to: "2026-12-01" });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("Từ ngày = Đến ngày (một ngày) là hợp lệ", async () => {
    nav.params = new URLSearchParams("from=2026-05-05&to=2026-05-05");
    renderPage();
    await waitFor(() => expect(service.list).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
