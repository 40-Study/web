/**
 * GroupActions: mỗi ô của bảng "nút hành động" ở phase 03 render đúng nút và gọi đúng API; lỗi GROUP_*
 * hiện câu tiếng Việt theo `code`.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";
import { renderWithQuery } from "@/test-utils/query-wrapper";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

import { toast } from "sonner";
import { groupService, type Group } from "@/services/group.service";
import { GroupActions } from "./group-actions";

function makeGroup(over: Partial<Group> = {}): Group {
  return {
    id: "g1",
    name: "Nhóm React",
    slug: "nhom-react",
    type: "STUDY_GROUP",
    privacy: "PUBLIC",
    max_members: 50,
    member_count: 5,
    created_by: "owner",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
    ...over,
  };
}

describe("GroupActions", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockReset();
    vi.mocked(toast.success).mockReset();
  });

  it("PUBLIC, chưa vào: 'Tham gia' gọi join và báo đã tham gia", async () => {
    const join = vi.spyOn(groupService, "join").mockResolvedValue({ status: "joined" });
    renderWithQuery(<GroupActions group={makeGroup()} />);

    fireEvent.click(screen.getByRole("button", { name: /Tham gia/ }));

    await waitFor(() => expect(join).toHaveBeenCalledWith("g1", undefined));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Bạn đã tham gia nhóm"));
  });

  it("PRIVATE, chưa có yêu cầu: 'Xin tham gia' mở hộp lời nhắn (<=300 ký tự) rồi gửi kèm lời nhắn", async () => {
    const join = vi.spyOn(groupService, "join").mockResolvedValue({ status: "pending" });
    renderWithQuery(<GroupActions group={makeGroup({ privacy: "PRIVATE" })} />);

    fireEvent.click(screen.getByRole("button", { name: /Xin tham gia/ }));
    const box = screen.getByLabelText(/Lời nhắn/) as HTMLTextAreaElement;
    expect(box.maxLength).toBe(300);
    fireEvent.change(box, { target: { value: "  Em muốn học cùng  " } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));

    await waitFor(() => expect(join).toHaveBeenCalledWith("g1", "Em muốn học cùng"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Đã gửi yêu cầu tham gia"));
  });

  it("PRIVATE, lời nhắn để trống: không gửi chuỗi rỗng", async () => {
    const join = vi.spyOn(groupService, "join").mockResolvedValue({ status: "pending" });
    renderWithQuery(<GroupActions group={makeGroup({ privacy: "PRIVATE" })} />);

    fireEvent.click(screen.getByRole("button", { name: /Xin tham gia/ }));
    fireEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));

    await waitFor(() => expect(join).toHaveBeenCalledWith("g1", undefined));
  });

  it("PRIVATE, đã có my_join_request: nút vô hiệu 'Đã gửi yêu cầu', không có 'Xin tham gia'", () => {
    renderWithQuery(
      <GroupActions group={makeGroup({ privacy: "PRIVATE", my_join_request: { id: "r1", status: "PENDING" } })} />
    );

    const sent = screen.getByRole("button", { name: /Đã gửi yêu cầu/ }) as HTMLButtonElement;
    expect(sent.disabled).toBe(true);
    expect(screen.queryByRole("button", { name: /Xin tham gia/ })).toBeNull();
  });

  it("SECRET, người ngoài: không có nút hành động nào", () => {
    renderWithQuery(<GroupActions group={makeGroup({ privacy: "SECRET" })} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("thành viên: 'Rời nhóm' phải qua xác nhận, rồi gọi leave và onLeft", async () => {
    const leave = vi.spyOn(groupService, "leave").mockResolvedValue({});
    const onLeft = vi.fn();
    renderWithQuery(<GroupActions group={makeGroup({ my_role: "MEMBER" })} onLeft={onLeft} />);

    fireEvent.click(screen.getByRole("button", { name: "Rời nhóm" }));
    expect(leave).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    fireEvent.click(Array.from(dialog.querySelectorAll("button")).find((b) => b.textContent === "Rời nhóm")!);

    await waitFor(() => expect(leave).toHaveBeenCalledWith("g1"));
    await waitFor(() => expect(onLeft).toHaveBeenCalled());
  });

  it("chủ nhóm: không có 'Rời nhóm'", () => {
    renderWithQuery(<GroupActions group={makeGroup({ my_role: "OWNER" })} />);
    expect(screen.queryByRole("button", { name: /Rời nhóm/ })).toBeNull();
  });

  it.each([
    ["GROUP_FULL", "Nhóm đã đủ thành viên"],
    ["GROUP_BANNED", "Bạn đã bị cấm khỏi nhóm này"],
    ["GROUP_ALREADY_MEMBER", "Bạn đã là thành viên của nhóm này"],
    ["GROUP_JOIN_REQUEST_EXISTS", "Bạn đã gửi yêu cầu tham gia nhóm này, đang chờ duyệt"],
  ])("join lỗi %s -> toast tiếng Việt theo code", async (code, expected) => {
    vi.spyOn(groupService, "join").mockRejectedValue(new ApiError(400, code, "english backend message"));
    renderWithQuery(<GroupActions group={makeGroup()} />);

    fireEvent.click(screen.getByRole("button", { name: /Tham gia/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expected));
  });
});
