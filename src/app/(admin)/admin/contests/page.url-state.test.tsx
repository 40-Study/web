/**
 * QA7-A08: tab "Tất cả" / bộ lọc trạng thái / từ khoá / trang của /admin/contests chỉ nằm trong useState nên F5 hay
 * Back quay về "Chờ duyệt" và link không chia sẻ được. Giờ chúng nằm trên URL như Đơn hàng / Người dùng / Nhật ký.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockSearch = "";
const replace = vi.fn();
const mockUseAdminContests = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/admin/contests",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));
vi.mock("@/hooks/queries/use-contest-manage", () => ({
  useAdminContests: (...args: unknown[]) => mockUseAdminContests(...args),
}));

import AdminContestsPage from "./page";

beforeEach(() => {
  replace.mockReset();
  mockSearch = "";
  mockUseAdminContests.mockReset();
  mockUseAdminContests.mockReturnValue({
    data: {
      items: [
        { id: "c1", title: "Cuộc thi QA7", phase: "PENDING_REVIEW", creator_name: "GV Một", start_time: "2026-12-01T01:00:00Z", end_time: "2026-12-01T03:00:00Z" },
      ],
      total_count: 45, page: 1, limit: 20, total_pages: 3 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
});

const lastParams = () => mockUseAdminContests.mock.calls.at(-1)?.[0];

describe("AdminContestsPage — QA7-A08 bộ lọc trên URL", () => {
  it("mở mặc định: tab Chờ duyệt, lọc PENDING_REVIEW, không ghi gì lên URL", () => {
    render(<AdminContestsPage />);

    expect(screen.getByTestId("tab-pending").getAttribute("aria-selected")).toBe("true");
    expect(lastParams()).toMatchObject({ status: "PENDING_REVIEW", page: 1 });
    expect(replace).not.toHaveBeenCalled();
  });

  it("?tab=all&status=PUBLISHED&q=toan&page=2 khôi phục đúng tab, bộ lọc, từ khoá và trang (reload / link chia sẻ)", () => {
    mockSearch = "tab=all&status=PUBLISHED&q=toan&page=2";
    render(<AdminContestsPage />);

    expect(screen.getByTestId("tab-all").getAttribute("aria-selected")).toBe("true");
    expect((screen.getByLabelText("Lọc theo trạng thái") as HTMLSelectElement).value).toBe("PUBLISHED");
    expect((screen.getByLabelText("Tìm cuộc thi") as HTMLInputElement).value).toBe("toan");
    expect(lastParams()).toMatchObject({ status: "PUBLISHED", q: "toan", page: 2 });
  });

  it("bấm tab 'Tất cả' ghi ?tab=all lên URL (replace, không đẩy history)", () => {
    render(<AdminContestsPage />);
    fireEvent.click(screen.getByTestId("tab-all"));

    expect(replace).toHaveBeenCalledWith("/admin/contests?tab=all", { scroll: false });
  });

  it("về tab 'Chờ duyệt' xoá tab, status và page khỏi URL nhưng giữ từ khoá", () => {
    mockSearch = "tab=all&status=PUBLISHED&page=3&q=toan";
    render(<AdminContestsPage />);
    fireEvent.click(screen.getByTestId("tab-pending"));

    expect(replace).toHaveBeenCalledWith("/admin/contests?q=toan", { scroll: false });
  });

  it("đổi bộ lọc trạng thái ghi ?status= và về trang 1", () => {
    mockSearch = "tab=all&page=3";
    render(<AdminContestsPage />);
    fireEvent.change(screen.getByLabelText("Lọc theo trạng thái"), { target: { value: "PUBLISHED" } });

    expect(replace).toHaveBeenCalledWith("/admin/contests?tab=all&status=PUBLISHED", { scroll: false });
  });

  it("bấm 'Sau' ghi ?page= của trang kế tiếp", () => {
    mockSearch = "tab=all&page=2";
    render(<AdminContestsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sau" }));

    expect(replace).toHaveBeenCalledWith("/admin/contests?tab=all&page=3", { scroll: false });
  });

  it("tham số lạ rơi về mặc định (không gửi status lạ lên API)", () => {
    mockSearch = "tab=zzz&status=nope&page=-4";
    render(<AdminContestsPage />);

    expect(screen.getByTestId("tab-pending").getAttribute("aria-selected")).toBe("true");
    expect(lastParams()).toMatchObject({ status: "PENDING_REVIEW", page: 1 });
  });

  it("QA7-A06: ?page=9999 vượt total_pages=3 với danh sách rỗng -> replace sang trang cuối, giữ tab và từ khoá", () => {
    mockSearch = "tab=all&q=toan&page=9999";
    mockUseAdminContests.mockReturnValue({
      data: { items: [], total_count: 45, page: 9999, limit: 20, total_pages: 3 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AdminContestsPage />);

    expect(replace).toHaveBeenCalledWith("/admin/contests?tab=all&q=toan&page=3", { scroll: false });
  });

  it("QA7-A06: không có kết quả nào (total_pages=0) thì không đẩy về trang 0", () => {
    mockSearch = "tab=all&page=4";
    mockUseAdminContests.mockReturnValue({
      data: { items: [], total_count: 0, page: 4, limit: 20, total_pages: 0 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<AdminContestsPage />);

    expect(replace).not.toHaveBeenCalled();
  });
});
