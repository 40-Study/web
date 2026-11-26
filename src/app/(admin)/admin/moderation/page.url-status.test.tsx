/** QA8-A11: lọc trạng thái báo cáo vi phạm nằm trên URL (?status=). */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAllReports = vi.fn();
const replace = vi.fn();
let search = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/admin/moderation",
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("@/hooks/queries/use-reports", () => ({
  useAllReports: (...args: unknown[]) => mockAllReports(...args),
  useUpdateReportStatus: () => ({ mutate: vi.fn(), isPending: false }),
}));

import AdminModerationPage from "./page";

beforeEach(() => {
  replace.mockReset();
  mockAllReports.mockReset();
  mockAllReports.mockReturnValue({ data: { data: [] }, isLoading: false, isError: false, error: null, refetch: vi.fn() });
});

describe("/admin/moderation — QA8-A11 bộ lọc trạng thái trên URL", () => {
  it("mở ?status=resolved: truy vấn lọc 'resolved'", () => {
    search = "status=resolved";
    render(<AdminModerationPage />);
    expect(mockAllReports.mock.calls.at(-1)?.[0]).toMatchObject({ status: "resolved" });
  });

  it("?status=ALL: không lọc trạng thái", () => {
    search = "status=ALL";
    render(<AdminModerationPage />);
    expect(mockAllReports.mock.calls.at(-1)?.[0]).toEqual({ page_size: 50 });
  });

  it("bấm 'Đã xử lý' ghi status lên URL", () => {
    search = "";
    render(<AdminModerationPage />);
    fireEvent.click(screen.getByRole("button", { name: "Đã xử lý" }));
    expect(replace).toHaveBeenCalledWith("/admin/moderation?status=resolved", { scroll: false });
  });
});
