/** Duyệt yêu cầu xin vào nhóm: chấp nhận, từ chối (lý do tuỳ chọn) và lỗi GROUP_FULL khi duyệt. */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";
import { renderWithQuery } from "@/test-utils/query-wrapper";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

import { toast } from "sonner";
import { groupService, type Group } from "@/services/group.service";
import { JoinRequestList } from "./join-request-list";

const group: Group = {
  id: "g1",
  name: "Nhóm React",
  slug: "nhom-react",
  type: "STUDY_GROUP",
  privacy: "PRIVATE",
  max_members: 50,
  member_count: 5,
  created_by: "owner",
  my_role: "ADMIN",
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
};

describe("JoinRequestList", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockReset();
    vi.spyOn(groupService, "listJoinRequests").mockResolvedValue({
      requests: [
        {
          id: "r1",
          group_id: "g1",
          user_id: "u1",
          user_name: "An",
          message: "Cho em vào với",
          status: "PENDING",
          created_at: "2026-09-02T00:00:00Z",
        },
      ],
      total_count: 1,
    });
  });

  it("hiện tên và lời nhắn của người xin vào", async () => {
    renderWithQuery(<JoinRequestList group={group} />);
    await screen.findByRole("button", { name: "Chấp nhận yêu cầu của An" });
    expect(screen.getByText(/Cho em vào với/)).toBeTruthy();
  });

  it("Chấp nhận gọi approveRequest đúng nhóm/yêu cầu", async () => {
    const approve = vi.spyOn(groupService, "approveRequest").mockResolvedValue({});
    renderWithQuery(<JoinRequestList group={group} />);

    fireEvent.click(await screen.findByRole("button", { name: "Chấp nhận yêu cầu của An" }));

    await waitFor(() => expect(approve).toHaveBeenCalledWith("g1", "r1"));
  });

  it("duyệt khi nhóm đầy -> toast 'Nhóm đã đủ thành viên' theo code GROUP_FULL", async () => {
    vi.spyOn(groupService, "approveRequest").mockRejectedValue(new ApiError(400, "GROUP_FULL", "group is full"));
    renderWithQuery(<JoinRequestList group={group} />);

    fireEvent.click(await screen.findByRole("button", { name: "Chấp nhận yêu cầu của An" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nhóm đã đủ thành viên"));
  });

  it("Từ chối kèm lý do: gửi lý do đã trim", async () => {
    const reject = vi.spyOn(groupService, "rejectRequest").mockResolvedValue({});
    renderWithQuery(<JoinRequestList group={group} />);

    fireEvent.click(await screen.findByRole("button", { name: "Từ chối yêu cầu của An" }));
    fireEvent.change(screen.getByLabelText(/Lý do/), { target: { value: "  Nhóm đã kín  " } });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Từ chối" }));

    await waitFor(() => expect(reject).toHaveBeenCalledWith("g1", "r1", "Nhóm đã kín"));
  });

  it("Từ chối không lý do: không gửi chuỗi rỗng", async () => {
    const reject = vi.spyOn(groupService, "rejectRequest").mockResolvedValue({});
    renderWithQuery(<JoinRequestList group={group} />);

    fireEvent.click(await screen.findByRole("button", { name: "Từ chối yêu cầu của An" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Từ chối" }));

    await waitFor(() => expect(reject).toHaveBeenCalledWith("g1", "r1", undefined));
  });

  it("không có yêu cầu: hiện trạng thái rỗng, không phải khung trống", async () => {
    vi.spyOn(groupService, "listJoinRequests").mockResolvedValue({ requests: [], total_count: 0 });
    renderWithQuery(<JoinRequestList group={group} />);

    expect(await screen.findByText("Không có yêu cầu nào đang chờ")).toBeTruthy();
  });
});

describe("JoinRequestList — tên hiển thị", () => {
  it("full_name, rồi user_name, cuối cùng 'Học viên'", async () => {
    const base = { group_id: "g1", status: "PENDING", created_at: "2026-09-02T00:00:00Z" };
    vi.spyOn(groupService, "listJoinRequests").mockResolvedValue({
      requests: [
        { ...base, id: "a", user_id: "ua", user_name: "an", full_name: "Nguyễn An" },
        { ...base, id: "b", user_id: "ub", user_name: "binh" },
        { ...base, id: "c", user_id: "uc", user_name: "" },
      ],
      total_count: 3,
    });
    renderWithQuery(<JoinRequestList group={group} />);

    expect(await screen.findByText("Nguyễn An")).toBeTruthy();
    expect(screen.getByText("binh")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chấp nhận yêu cầu của Học viên" })).toBeTruthy();
    expect(screen.queryByText("an")).toBeNull();
  });
});
