/**
 * MemberList ở chế độ quản lý: hành động nào hiện trên dòng nào (không lên chính mình, không lên OWNER,
 * ADMIN không lên ADMIN) và gọi đúng API sau khi xác nhận.
 */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

import { groupService, type Group, type GroupMember } from "@/services/group.service";
import { ApiError } from "@/lib/errors";
import { MEMBERS_FORBIDDEN_MESSAGE, MemberList } from "./member-list";

const group = (role: string): Group => ({
  id: "g1",
  name: "Nhóm React",
  slug: "nhom-react",
  type: "STUDY_GROUP",
  privacy: "PRIVATE",
  max_members: 50,
  member_count: 5,
  created_by: "u-owner",
  my_role: role,
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
});

const member = (id: string, name: string, role: string): GroupMember => ({
  id: `m-${id}`,
  user_id: id,
  user_name: name,
  role,
  status: "ACTIVE",
  joined_at: "2026-09-01T00:00:00Z",
});

const MEMBERS = [
  member("u-owner", "Chủ Nhóm", "OWNER"),
  member("u-admin", "Quản Trị", "ADMIN"),
  member("u-mod", "Điều Hành", "MODERATOR"),
  member("u-mem", "Thành Viên", "MEMBER"),
];

function rowOf(name: string): HTMLElement {
  const link = screen.getByRole("link", { name: new RegExp(name) });
  return link.closest("div.flex-wrap") as HTMLElement;
}

describe("MemberList — chế độ quản lý", () => {
  beforeEach(() => {
    vi.spyOn(groupService, "listMembers").mockResolvedValue({ members: MEMBERS, total_count: 4 });
  });

  it("OWNER (xem bằng tài khoản u-owner): dòng của mình và OWNER không có hành động; ADMIN/MOD/MEMBER có Gỡ + Cấm", async () => {
    renderWithQuery(<MemberList group={group("OWNER")} viewerId="u-owner" manage />);
    await screen.findByText("Thành Viên");

    expect(within(rowOf("Chủ Nhóm")).queryByRole("button")).toBeNull();
    for (const name of ["Quản Trị", "Điều Hành", "Thành Viên"]) {
      expect(within(rowOf(name)).getByRole("button", { name: /Gỡ/ })).toBeTruthy();
      expect(within(rowOf(name)).getByRole("button", { name: /Cấm/ })).toBeTruthy();
    }
  });

  it("ADMIN: không có hành động lên OWNER và ADMIN khác, có lên MODERATOR/MEMBER", async () => {
    renderWithQuery(<MemberList group={group("ADMIN")} viewerId="u-self-admin" manage />);
    await screen.findByText("Thành Viên");

    expect(within(rowOf("Chủ Nhóm")).queryByRole("button")).toBeNull();
    expect(within(rowOf("Quản Trị")).queryByRole("button")).toBeNull();
    expect(within(rowOf("Điều Hành")).getByRole("button", { name: /Cấm/ })).toBeTruthy();
    expect(within(rowOf("Thành Viên")).getByRole("button", { name: /Gỡ/ })).toBeTruthy();
  });

  it("MODERATOR: không có hành động quản lý thành viên nào", async () => {
    renderWithQuery(<MemberList group={group("MODERATOR")} viewerId="u-self-mod" manage />);
    await screen.findByText("Thành Viên");

    expect(screen.queryAllByRole("button", { name: /Gỡ|Cấm/ })).toHaveLength(0);
  });

  it("tab Thành viên (manage=false): chỉ đọc, dù người xem là OWNER", async () => {
    renderWithQuery(<MemberList group={group("OWNER")} viewerId="u-owner" />);
    await screen.findByText("Thành Viên");

    expect(screen.queryAllByRole("button", { name: /Gỡ|Cấm/ })).toHaveLength(0);
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
  });

  it("Cấm phải xác nhận rồi mới gọi banMember đúng người", async () => {
    const ban = vi.spyOn(groupService, "banMember").mockResolvedValue({});
    renderWithQuery(<MemberList group={group("OWNER")} viewerId="u-owner" manage />);
    await screen.findByText("Thành Viên");

    fireEvent.click(within(rowOf("Thành Viên")).getByRole("button", { name: /Cấm/ }));
    expect(ban).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cấm" }));

    await waitFor(() => expect(ban).toHaveBeenCalledWith("g1", "u-mem"));
  });

  it("Gỡ phải xác nhận rồi mới gọi removeMember", async () => {
    const remove = vi.spyOn(groupService, "removeMember").mockResolvedValue({});
    renderWithQuery(<MemberList group={group("OWNER")} viewerId="u-owner" manage />);
    await screen.findByText("Điều Hành");

    fireEvent.click(within(rowOf("Điều Hành")).getByRole("button", { name: /Gỡ/ }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Gỡ khỏi nhóm" }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith("g1", "u-mod"));
  });

  it("đổi vai: OWNER gán được ADMIN, ADMIN thì không có lựa chọn ADMIN", async () => {
    const updateRole = vi.spyOn(groupService, "updateMemberRole").mockResolvedValue({});
    const owner = renderWithQuery(<MemberList group={group("OWNER")} viewerId="u-owner" manage />);
    await screen.findByText("Thành Viên");

    const select = within(rowOf("Thành Viên")).getByLabelText(/Đổi vai trò của Thành Viên/) as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(["", "ADMIN", "MODERATOR"]);
    fireEvent.change(select, { target: { value: "MODERATOR" } });
    await waitFor(() => expect(updateRole).toHaveBeenCalledWith("g1", "u-mem", "MODERATOR"));
    owner.unmount();

    renderWithQuery(<MemberList group={group("ADMIN")} viewerId="u-self-admin" manage />);
    await screen.findByText("Thành Viên");
    const adminSelect = within(rowOf("Thành Viên")).getByLabelText(/Đổi vai trò của Thành Viên/) as HTMLSelectElement;
    expect(Array.from(adminSelect.options).map((o) => o.value)).toEqual(["", "MODERATOR"]);
  });
});

describe("MemberList — người ngoài nhóm PRIVATE", () => {
  it("403 ERR_FORBIDDEN: báo rõ chỉ thành viên mới xem được, không phải lỗi chung chung, không có nút Thử lại", async () => {
    const spy = vi.spyOn(groupService, "listMembers").mockRejectedValue(new ApiError(403, "FORBIDDEN", "ERR_FORBIDDEN"));
    renderWithQuery(<MemberList group={group("")} viewerId="u-out" />);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(MEMBERS_FORBIDDEN_MESSAGE);
    expect(screen.queryByRole("button", { name: /Thử lại/ })).toBeNull();
    // 403 là dứt khoát: chỉ một lần gọi, không retry.
    expect(spy).toHaveBeenCalledTimes(1);
  });


});

describe("MemberList — tên hiển thị", () => {
  it("dùng full_name khi có, rơi về user_name khi thiếu hoặc rỗng, ở cả danh sách lẫn nhãn Đổi vai trò", async () => {
    vi.spyOn(groupService, "listMembers").mockResolvedValue({
      members: [
        { ...member("u1", "student1", "OWNER"), full_name: "Lê Văn C" },
        { ...member("u2", "student2", "MEMBER"), full_name: "Phạm Thị D" },
        { ...member("u3", "student3", "MEMBER") },
        { ...member("u4", "student4", "MEMBER"), full_name: "   " },
      ],
      total_count: 4,
    });
    renderWithQuery(<MemberList group={group("OWNER")} viewerId="u1" manage />);

    expect(await screen.findByText("Phạm Thị D")).toBeTruthy();
    expect(screen.getByText(/Lê Văn C/)).toBeTruthy();
    expect(screen.getByText("student3")).toBeTruthy();
    expect(screen.getByText("student4")).toBeTruthy();
    expect(screen.queryByText("student2")).toBeNull();
    expect(screen.getByLabelText("Đổi vai trò của Phạm Thị D")).toBeTruthy();
  });
});
