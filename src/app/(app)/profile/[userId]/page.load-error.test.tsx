/**
 * Q10-STU-02: GET public-profile lỗi 5xx / mất mạng từng hiện "Hồ sơ này không tồn tại" không có "Thử lại". Chỉ 404 mới là
 * "không tồn tại"; lỗi khác phải là hộp lỗi tải + "Thử lại".
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useParams: () => ({ userId: "u-2" }) }));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: () => ({ user: { id: "viewer" }, hasHydrated: true, activeRole: null }),
}));

const refetch = vi.fn();
let mockError: unknown = null;
vi.mock("@/hooks/queries/use-auth", () => ({
  usePublicProfile: () => ({ data: undefined, isLoading: false, error: mockError, refetch }),
}));

import PublicProfilePage from "./page";
import { ApiError, NetworkError, NotFoundError } from "@/lib/errors";

beforeEach(() => refetch.mockReset());

describe("PublicProfilePage — lỗi tải (Q10-STU-02)", () => {
  it.each([
    ["5xx", new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại")],
    ["mất mạng", new NetworkError()],
  ])("%s: hộp lỗi + 'Thử lại', KHÔNG nói hồ sơ không tồn tại", (_name, error) => {
    mockError = error;
    render(<PublicProfilePage />);
    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/không tồn tại/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("404: vẫn là thẻ 'không tồn tại', không có 'Thử lại'", () => {
    mockError = new NotFoundError();
    render(<PublicProfilePage />);
    expect(screen.getByText(/không tồn tại/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
  });
});
