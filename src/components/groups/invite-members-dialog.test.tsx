/**
 * Dialog mời bạn bè vào nhóm: chọn, đếm, giới hạn 50, "Đã trong nhóm", kết quả một phần / toàn từ chối
 * (403) với LÝ DO, chọn lại người bị từ chối, và trạng thái rỗng. Không có kịch bản "bấm Mời mà không
 * có phản hồi".
 */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

import { toast } from "sonner";
import { friendService, type FriendItem } from "@/services/friend.service";
import { groupService, type Group } from "@/services/group.service";
import { INVITE_MAX, InviteMembersDialog } from "./invite-members-dialog";

const group = (over: Partial<Group> = {}): Group => ({
  id: "g1",
  name: "Nhóm React",
  slug: "nhom-react",
  type: "STUDY_GROUP",
  privacy: "PUBLIC",
  max_members: 100,
  member_count: 5,
  created_by: "owner",
  my_role: "OWNER",
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
  ...over,
});

const friend = (id: string, name: string): FriendItem => ({
  friendship_id: `f-${id}`,
  user: { user_id: id, user_name: id, full_name: name },
  since: "2026-09-01T00:00:00Z",
});

const FRIENDS = [friend("u1", "An"), friend("u2", "Bình"), friend("u3", "Chi")];

const mockFriends = (friends: FriendItem[] = FRIENDS) =>
  vi.spyOn(friendService, "list").mockResolvedValue({ friends, total_count: friends.length, page: 1, limit: 100 });
const mockMembers = (ids: string[] = []) =>
  vi.spyOn(groupService, "listMembers").mockResolvedValue({
    members: ids.map((id) => ({ id: `m-${id}`, user_id: id, user_name: id, role: "MEMBER", status: "ACTIVE" })),
    total_count: ids.length,
  });

const open = (g: Group = group(), onOpenChange = vi.fn()) =>
  renderWithQuery(<InviteMembersDialog group={g} open onOpenChange={onOpenChange} />);
const check = (name: string) => fireEvent.click(screen.getByRole("checkbox", { name }));
// getByRole trên danh sách 51 dòng rất chậm (hàng trăm ms/lần); test giới hạn 50 tra thẳng theo id ô chọn.
const box = (userId: string) => document.getElementById(`invite-${userId}`) as HTMLInputElement;
const inviteButton = () => screen.getByRole("button", { name: /^Mời \(/ }) as HTMLButtonElement;

describe("InviteMembersDialog", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockReset();
    vi.mocked(toast.warning).mockReset();
    vi.mocked(toast.success).mockReset();
    mockFriends();
    mockMembers();
  });

  it("nút Mời khoá khi chưa chọn ai; bộ đếm 'Đã chọn n/50'", async () => {
    open();
    await screen.findByRole("checkbox", { name: "An" });

    expect(inviteButton().disabled).toBe(true);
    expect(screen.getByText(`Đã chọn 0/${INVITE_MAX}`)).toBeTruthy();
    check("An");
    check("Bình");
    expect(screen.getByText(`Đã chọn 2/${INVITE_MAX}`)).toBeTruthy();
    expect(inviteButton().disabled).toBe(false);
    expect(inviteButton().textContent).toBe("Mời (2)");
  });

  it("bạn đã trong nhóm: mờ, nhãn 'Đã trong nhóm', không chọn được", async () => {
    mockMembers(["u2"]);
    open();
    await screen.findByText("Đã trong nhóm");

    expect((screen.getByRole("checkbox", { name: "Bình" }) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("checkbox", { name: "An" }) as HTMLInputElement).disabled).toBe(false);
  });

  it("chờ tải xong danh sách thành viên rồi mới bật nút Mời", async () => {
    let resolveMembers!: (v: { members: []; total_count: number }) => void;
    vi.spyOn(groupService, "listMembers").mockReturnValue(new Promise((r) => (resolveMembers = r)));
    open();
    await screen.findByRole("checkbox", { name: "An" });
    check("An");

    expect(inviteButton().disabled).toBe(true);
    resolveMembers({ members: [], total_count: 0 });
    await waitFor(() => expect(inviteButton().disabled).toBe(false));
  });

  it("tối đa 50: chọn đủ 50 thì các ô còn lại bị khoá, bỏ chọn thì mở lại", async () => {
    const many = Array.from({ length: INVITE_MAX + 1 }, (_, i) => friend(`u${i}`, `Bạn ${i}`));
    mockFriends(many);
    open();
    await screen.findByRole("checkbox", { name: "Bạn 0" });

    for (let i = 0; i < INVITE_MAX; i++) fireEvent.click(box(`u${i}`));

    expect(screen.getByText(`Đã chọn ${INVITE_MAX}/${INVITE_MAX}`)).toBeTruthy();
    expect(box(`u${INVITE_MAX}`).disabled).toBe(true); // người thứ 51 bị khoá
    fireEvent.click(box("u0")); // bỏ chọn một người
    expect(box(`u${INVITE_MAX}`).disabled).toBe(false);
  });

  it("cảnh báo khi số chọn vượt chỗ trống còn lại của nhóm", async () => {
    open(group({ max_members: 6, member_count: 5 })); // còn 1 chỗ
    await screen.findByRole("checkbox", { name: "An" });

    check("An");
    expect(screen.queryByRole("alert")).toBeNull();
    check("Bình");
    expect(screen.getByRole("alert").textContent).toMatch(/còn 1 chỗ trống/);
  });

  it("mời thành công hết: gửi đúng id, hiện 'Đã thêm k người', toast success", async () => {
    const invite = vi
      .spyOn(groupService, "inviteMembers")
      .mockResolvedValue({ message: "ok", data: { invited: ["u1", "u2"], rejected: [] } });
    open();
    await screen.findByRole("checkbox", { name: "An" });
    check("An");
    check("Bình");

    fireEvent.click(inviteButton());

    await waitFor(() => expect(invite).toHaveBeenCalledWith("g1", ["u1", "u2"]));
    expect(await screen.findByText("Đã thêm 2 người vào nhóm")).toBeTruthy();
    expect(toast.success).toHaveBeenCalledWith("Đã mời 2 người");
    expect(screen.queryByText(/chưa mời được/)).toBeNull();
  });

  it("mời một phần: dialog KHÔNG đóng, liệt kê từng người bị từ chối kèm LÝ DO, toast warning", async () => {
    vi.spyOn(groupService, "inviteMembers").mockResolvedValue({
      message: "x",
      data: {
        invited: ["u1"],
        rejected: [
          { user_id: "u2", code: "GROUP_MEMBER_BANNED" },
          { user_id: "u3", code: "GROUP_FULL" },
        ],
      },
    });
    const onOpenChange = vi.fn();
    open(group(), onOpenChange);
    await screen.findByRole("checkbox", { name: "An" });
    check("An");
    check("Bình");
    check("Chi");
    fireEvent.click(inviteButton());

    expect(await screen.findByText("Đã thêm 1 người vào nhóm")).toBeTruthy();
    const summary = screen.getByText("2 người chưa mời được").closest("div")!.parentElement!;
    expect(within(summary).getByText(/Bình/).parentElement!.textContent).toBe("Bình, Đang bị cấm khỏi nhóm");
    expect(within(summary).getByText(/Chi/).parentElement!.textContent).toBe("Chi, Nhóm đã đầy");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith("Đã mời 1 người, 2 người chưa mời được");
  });

  it("403 toàn GROUP_INVITE_NOT_ALLOWED: vẫn thấy danh sách từ chối trong dialog VÀ toast error", async () => {
    vi.spyOn(groupService, "inviteMembers").mockResolvedValue({
      message: "Bạn chỉ có thể mời người có quan hệ hợp lệ.",
      allRejected: true,
      data: { invited: [], rejected: [{ user_id: "u1", code: "GROUP_INVITE_NOT_ALLOWED" }] },
    });
    open();
    await screen.findByRole("checkbox", { name: "An" });
    check("An");
    fireEvent.click(inviteButton());

    expect(await screen.findByText("1 người chưa mời được")).toBeTruthy();
    expect(screen.getByText(/Chưa có quan hệ để mời/)).toBeTruthy();
    expect(screen.queryByText(/Đã thêm/)).toBeNull();
    expect(toast.error).toHaveBeenCalledWith("Bạn chỉ có thể mời người có quan hệ hợp lệ.");
  });

  it("200 nhưng không ai mới (toàn đã trong nhóm): có phản hồi rõ, không im lặng", async () => {
    vi.spyOn(groupService, "inviteMembers").mockResolvedValue({
      message: "ok",
      data: { invited: [], rejected: [{ user_id: "u1", code: "GROUP_ALREADY_MEMBER" }] },
    });
    open();
    await screen.findByRole("checkbox", { name: "An" });
    check("An");
    fireEvent.click(inviteButton());

    expect(await screen.findByText(/Đã trong nhóm/)).toBeTruthy();
    expect(toast.warning).toHaveBeenCalled();
  });

  it("'Chọn lại người bị từ chối': quay về danh sách, chỉ những người đó được tick", async () => {
    vi.spyOn(groupService, "inviteMembers").mockResolvedValue({
      message: "x",
      data: { invited: ["u1"], rejected: [{ user_id: "u2", code: "GROUP_FULL" }] },
    });
    open();
    await screen.findByRole("checkbox", { name: "An" });
    check("An");
    check("Bình");
    fireEvent.click(inviteButton());
    fireEvent.click(await screen.findByRole("button", { name: "Chọn lại người bị từ chối" }));

    await screen.findByText("Đã chọn 1/50");
    expect((screen.getByRole("checkbox", { name: "Bình" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("checkbox", { name: "An" }) as HTMLInputElement).checked).toBe(false);
  });

  it("'Xong' đóng dialog", async () => {
    vi.spyOn(groupService, "inviteMembers").mockResolvedValue({ message: "ok", data: { invited: ["u1"], rejected: [] } });
    const onOpenChange = vi.fn();
    open(group(), onOpenChange);
    await screen.findByRole("checkbox", { name: "An" });
    check("An");
    fireEvent.click(inviteButton());

    fireEvent.click(await screen.findByRole("button", { name: "Xong" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("lỗi khác 403 (vd. 500): toast lỗi, ở lại màn chọn để thử lại", async () => {
    vi.spyOn(groupService, "inviteMembers").mockRejectedValue(new Error("boom"));
    open();
    await screen.findByRole("checkbox", { name: "An" });
    check("An");
    fireEvent.click(inviteButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByText("Đã chọn 1/50")).toBeTruthy();
    expect(inviteButton().disabled).toBe(false);
  });

  it("chưa có bạn bè: hướng dẫn 'Kết bạn để mời vào nhóm' + liên kết /friends?tab=search", async () => {
    mockFriends([]);
    open();

    expect(await screen.findByText("Bạn chưa có bạn bè nào")).toBeTruthy();
    expect(screen.getByText(/Kết bạn để mời vào nhóm/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Tìm bạn" }).getAttribute("href")).toBe("/friends?tab=search");
    expect(inviteButton().disabled).toBe(true);
  });

  it("đóng dialog rồi mở lại: không giữ lựa chọn cũ", async () => {
    const { rerender } = open();
    await screen.findByRole("checkbox", { name: "An" });
    check("An");
    expect(screen.getByText("Đã chọn 1/50")).toBeTruthy();

    rerender(<InviteMembersDialog group={group()} open={false} onOpenChange={vi.fn()} />);
    rerender(<InviteMembersDialog group={group()} open onOpenChange={vi.fn()} />);

    await screen.findByText("Đã chọn 0/50");
  });
});
