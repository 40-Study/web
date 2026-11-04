/** QA3-20: id người dùng không tồn tại (404) hiện trạng thái "không tìm thấy" riêng, không phải khối lỗi + "Thử lại". */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, NotFoundError } from "@/lib/errors";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "does-not-exist" }),
  useRouter: () => ({ push, replace: vi.fn() }),
}));

const mockDetail = vi.fn();
vi.mock("@/hooks/queries/use-admin-users", () => ({
  useAdminUserDetail: () => mockDetail(),
  useAssignUserSystemRole: () => ({ mutate: vi.fn(), isPending: false }),
  useRevokeUserSystemRole: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateUserStatus: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/queries/use-admin", () => ({ useSystemRoles: () => ({ data: [] }) }));

import AdminUserDetailPage from "./page";

describe("/admin/users/[id] — không tìm thấy", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("404: hiện 'Không tìm thấy người dùng' + nút về danh sách, KHÔNG có nút Thử lại", () => {
    mockDetail.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new NotFoundError("not found"), refetch: vi.fn() });
    render(<AdminUserDetailPage />);

    expect(screen.getByText("Không tìm thấy người dùng")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Thử lại/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Về danh sách người dùng" }));
    expect(push).toHaveBeenCalledWith("/admin/users");
  });

  it("lỗi khác (500): vẫn là khối lỗi chung có Thử lại", () => {
    mockDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError(500, "INTERNAL", "boom"),
      refetch: vi.fn(),
    });
    render(<AdminUserDetailPage />);

    expect(screen.queryByText("Không tìm thấy người dùng")).toBeNull();
    expect(screen.getByRole("button", { name: /Thử lại/ })).toBeTruthy();
  });
});
