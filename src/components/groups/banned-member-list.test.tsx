/**
 * Danh sách bị cấm: gọi `?status=BANNED` và CHỈ hiện dòng thật sự BANNED. Bắt từ kiểm sống với backend
 * `main` (chưa có phase 02): nó lờ `status` và trả người ACTIVE, làm tab hiện cả chủ nhóm kèm "Bỏ cấm".
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

import { groupService, type Group, type GroupMember } from "@/services/group.service";
import { BannedMemberList } from "./banned-member-list";

const group: Group = {
  id: "g1",
  name: "Nhóm React",
  slug: "nhom-react",
  type: "STUDY_GROUP",
  privacy: "PRIVATE",
  max_members: 50,
  member_count: 3,
  created_by: "owner",
  my_role: "OWNER",
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
};

const member = (id: string, name: string, status: string, role = "MEMBER"): GroupMember => ({
  id: `m-${id}`,
  user_id: id,
  user_name: name,
  role,
  status,
});

describe("BannedMemberList", () => {
  it("yêu cầu đúng ?status=BANNED và cho Bỏ cấm người bị cấm", async () => {
    const list = vi
      .spyOn(groupService, "listMembers")
      .mockResolvedValue({ members: [member("u-bad", "Bạn Vi Phạm", "BANNED")], total_count: 1 });
    const unban = vi.spyOn(groupService, "unbanMember").mockResolvedValue({});
    renderWithQuery(<BannedMemberList group={group} />);

    fireEvent.click(await screen.findByRole("button", { name: "Bỏ cấm Bạn Vi Phạm" }));

    expect(list).toHaveBeenCalledWith("g1", expect.objectContaining({ status: "BANNED" }));
    await waitFor(() => expect(unban).toHaveBeenCalledWith("g1", "u-bad"));
  });

  it("backend cũ lờ ?status và trả người ACTIVE: KHÔNG hiện họ (kể cả chủ nhóm) kèm 'Bỏ cấm'", async () => {
    vi.spyOn(groupService, "listMembers").mockResolvedValue({
      members: [member("u-owner", "Chủ Nhóm", "ACTIVE", "OWNER"), member("u-mem", "Thành Viên", "ACTIVE")],
      total_count: 2,
    });
    renderWithQuery(<BannedMemberList group={group} />);

    expect(await screen.findByText("Chưa cấm ai")).toBeTruthy();
    expect(screen.queryByText("Chủ Nhóm")).toBeNull();
    expect(screen.queryByRole("button", { name: /Bỏ cấm/ })).toBeNull();
  });

  it("danh sách lẫn lộn: chỉ giữ dòng BANNED", async () => {
    vi.spyOn(groupService, "listMembers").mockResolvedValue({
      members: [member("u-owner", "Chủ Nhóm", "ACTIVE", "OWNER"), member("u-bad", "Bạn Vi Phạm", "BANNED")],
      total_count: 2,
    });
    renderWithQuery(<BannedMemberList group={group} />);

    expect(await screen.findByText("Bạn Vi Phạm")).toBeTruthy();
    expect(screen.queryByText("Chủ Nhóm")).toBeNull();
  });
});
