/** Q6-PG-11: tab trạng thái của /contests nằm trên URL (?tab=), tải lại / Back không mất. */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let currentParams = new URLSearchParams();
const replace = vi.fn();
const usePublicContests = vi.fn();
let role: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => currentParams,
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: () => ({ isAuthenticated: role !== null, activeRole: role }),
}));
vi.mock("@/hooks/queries/use-contests", () => ({
  usePublicContests: (p: unknown) => usePublicContests(p),
  useMyContests: () => ({ data: undefined, isLoading: false, error: null, refetch: vi.fn() }),
}));

// eslint-disable-next-line import/first
import ContestsPage from "./page";

beforeEach(() => {
  currentParams = new URLSearchParams();
  role = null;
  replace.mockReset();
  usePublicContests.mockReset().mockReturnValue({ data: { items: [], total: 0, page: 1, total_pages: 1 }, isLoading: false, error: null, refetch: vi.fn() });
});

describe("ContestsPage — tab trên URL", () => {
  it("bấm tab 'Đang diễn ra' ghi ?tab=ACTIVE bằng router.replace", () => {
    render(<ContestsPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Đang diễn ra" }));
    expect(replace).toHaveBeenCalledWith("/contests?tab=ACTIVE", { scroll: false });
  });

  it("bấm 'Tất cả' về /contests sạch", () => {
    currentParams = new URLSearchParams("tab=ACTIVE");
    render(<ContestsPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Tất cả" }));
    expect(replace).toHaveBeenCalledWith("/contests", { scroll: false });
  });

  it("tải trang với ?tab=ENDED: tab Đã kết thúc được chọn và phase gửi lên backend", () => {
    currentParams = new URLSearchParams("tab=ENDED");
    render(<ContestsPage />);
    expect(screen.getByRole("tab", { name: "Đã kết thúc" }).getAttribute("aria-selected")).toBe("true");
    expect(usePublicContests).toHaveBeenCalledWith(expect.objectContaining({ phase: "ENDED" }));
  });

  it("?tab= rác -> Tất cả; ?tab=MINE khi không phải học viên -> Tất cả", () => {
    currentParams = new URLSearchParams("tab=hack");
    const { unmount } = render(<ContestsPage />);
    expect(screen.getByRole("tab", { name: "Tất cả" }).getAttribute("aria-selected")).toBe("true");
    unmount();
    currentParams = new URLSearchParams("tab=MINE");
    render(<ContestsPage />);
    expect(screen.getByRole("tab", { name: "Tất cả" }).getAttribute("aria-selected")).toBe("true");
  });

  it("học viên: ?tab=MINE chọn 'Cuộc thi của tôi'", () => {
    role = "STUDENT";
    currentParams = new URLSearchParams("tab=MINE");
    render(<ContestsPage />);
    expect(screen.getByRole("tab", { name: "Cuộc thi của tôi" }).getAttribute("aria-selected")).toBe("true");
  });
});
