/** Q10 #148 H1: /groups còn danh sách cache mà refetch nền lỗi: giữ nhóm + thông báo 'Thử lại' (trước đây im lặng). */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const group = { id: "g1", name: "Nhóm Toán", slug: "nhom-toan", description: "", privacy: "PUBLIC", member_count: 2, my_role: "OWNER" };
const refetchMine = vi.fn(async () => undefined);
let mine: { data: unknown; isError: boolean };

vi.mock("@/hooks/queries/use-groups", () => ({
  useGroups: () => ({ data: { groups: [] }, isLoading: false, isError: false, refetch: vi.fn() }),
  useMyJoinedGroups: () => ({ ...mine, isLoading: false, error: new Error("boom"), refetch: refetchMine }),
  useCreateGroup: () => ({ mutate: vi.fn(), isPending: false }),
  useJoinGroup: () => ({ mutate: vi.fn(), isPending: false }),
}));

import GroupsPage from "./page";

beforeEach(() => refetchMine.mockClear());

describe("/groups — Q10 #148 H1", () => {
  it("refetch nền lỗi mà còn nhóm: giữ danh sách + thông báo 'Thử lại', không có hộp lỗi", () => {
    mine = { data: { groups: [group] }, isError: true };
    render(<GroupsPage />);
    expect(screen.getByRole("link", { name: "Nhóm Toán" })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được danh sách nhóm");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchMine).toHaveBeenCalledTimes(1);
  });

  it("lần tải đầu lỗi: hộp lỗi, không phải thông báo dữ liệu cũ; không lỗi: không có thông báo", () => {
    mine = { data: { groups: [group] }, isError: false };
    const { unmount } = render(<GroupsPage />);
    expect(screen.queryByRole("status")).toBeNull();
    unmount();
    mine = { data: undefined, isError: true };
    render(<GroupsPage />);
    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/Không làm mới được/)).toBeNull();
  });
});
