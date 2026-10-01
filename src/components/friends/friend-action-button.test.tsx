/**
 * FriendActionButton: đúng MỘT nút theo `relationship` và gọi đúng API. Xoá nhánh hoặc đổi trạng thái
 * trong switch thì ô tương ứng đỏ.
 */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BusinessApiError } from "@/services/business-request";
import { renderWithQuery } from "@/test-utils/query-wrapper";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

import { toast } from "sonner";
import { RateLimitError } from "@/lib/errors";
import { friendService } from "@/services/friend.service";
import { FriendActionButton } from "./friend-action-button";

const user = { user_id: "u1", user_name: "lan" };

describe("FriendActionButton — một nút theo relationship", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockReset();
    vi.mocked(toast.success).mockReset();
  });

  it("NONE: 'Kết bạn' gửi lời mời", async () => {
    const send = vi.spyOn(friendService, "sendRequest").mockResolvedValue({ id: "r1", status: "PENDING", user });
    renderWithQuery(<FriendActionButton userId="u1" status="NONE" name="Lan" />);

    fireEvent.click(screen.getByRole("button", { name: "Kết bạn với Lan" }));

    await waitFor(() => expect(send).toHaveBeenCalledWith("u1"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Đã gửi lời mời kết bạn"));
  });

  it("NONE nhưng đối phương đã gửi từ trước (server tự chấp nhận): toast 'trở thành bạn bè'", async () => {
    vi.spyOn(friendService, "sendRequest").mockResolvedValue({ id: "r1", status: "ACCEPTED", user });
    renderWithQuery(<FriendActionButton userId="u1" status="NONE" />);

    fireEvent.click(screen.getByRole("button", { name: "Kết bạn" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Hai bạn đã trở thành bạn bè"));
  });

  it("PENDING_OUT có requestId: 'Huỷ lời mời' gọi cancel, không có nút Kết bạn", async () => {
    const cancel = vi.spyOn(friendService, "cancel").mockResolvedValue(null);
    renderWithQuery(<FriendActionButton userId="u1" status="PENDING_OUT" requestId="r7" />);

    expect(screen.queryByRole("button", { name: /Kết bạn/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Huỷ lời mời" }));

    await waitFor(() => expect(cancel).toHaveBeenCalledWith("r7"));
  });

  it("PENDING_OUT thiếu requestId: khoá nút và KHÔNG tự gọi relationship (search đã có request_id)", () => {
    const lookup = vi.spyOn(friendService, "relationship");
    const cancel = vi.spyOn(friendService, "cancel").mockResolvedValue(null);
    renderWithQuery(<FriendActionButton userId="u1" status="PENDING_OUT" />);

    const button = screen.getByRole("button", { name: "Huỷ lời mời" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(lookup).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });
  it("PENDING_IN: 'Chấp nhận' gọi accept", async () => {
    const accept = vi.spyOn(friendService, "accept").mockResolvedValue({ id: "r2", status: "ACCEPTED", user });
    renderWithQuery(<FriendActionButton userId="u1" status="PENDING_IN" requestId="r2" />);

    fireEvent.click(screen.getByRole("button", { name: "Chấp nhận" }));

    await waitFor(() => expect(accept).toHaveBeenCalledWith("r2"));
  });

  it("FRIENDS: 'Bạn bè' chỉ mở xác nhận; huỷ kết bạn chỉ chạy sau khi xác nhận", async () => {
    const unfriend = vi.spyOn(friendService, "unfriend").mockResolvedValue(null);
    renderWithQuery(<FriendActionButton userId="u1" status="FRIENDS" name="Lan" />);

    fireEvent.click(screen.getByRole("button", { name: "Bạn bè với Lan" }));
    expect(unfriend).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Huỷ kết bạn" }));

    await waitFor(() => expect(unfriend).toHaveBeenCalledWith("u1"));
  });

  it("BLOCKED_BY_ME: 'Bỏ chặn' gọi unblock", async () => {
    const unblock = vi.spyOn(friendService, "unblock").mockResolvedValue(null);
    renderWithQuery(<FriendActionButton userId="u1" status="BLOCKED_BY_ME" />);

    fireEvent.click(screen.getByRole("button", { name: "Bỏ chặn" }));

    await waitFor(() => expect(unblock).toHaveBeenCalledWith("u1"));
  });

  it("SELF: không có nút nào", () => {
    const { container } = renderWithQuery(<FriendActionButton userId="me" status="SELF" />);
    expect(container.querySelector("button")).toBeNull();
  });

  it.each([
    [409, "FRIEND_REQUEST_COOLDOWN", "Bạn chưa thể gửi lời mời cho người này lúc này."],
    [403, "FRIEND_REQUEST_NOT_ALLOWED", "Không thể gửi lời mời cho người này."],
    [429, "FRIEND_DAILY_LIMIT_REACHED", "Hôm nay bạn đã gửi đủ lời mời, hãy thử lại vào ngày mai."],
    [429, "FRIEND_PENDING_LIMIT_REACHED", "Bạn đang có quá nhiều lời mời chờ phản hồi. Hãy đợi hoặc huỷ bớt lời mời cũ."],
    [409, "FRIEND_LIMIT_REACHED", "Một trong hai bạn đã đạt số lượng bạn bè tối đa"],
  ])("gửi lời mời lỗi %i %s -> toast tiếng Việt đúng lý do", async (status, code, expected) => {
    vi.spyOn(friendService, "sendRequest").mockRejectedValue(new BusinessApiError(status, code, "english"));
    renderWithQuery(<FriendActionButton userId="u1" status="NONE" />);

    fireEvent.click(screen.getByRole("button", { name: "Kết bạn" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expected));
  });

  it("lỗi 'lời mời không còn chờ' vẫn làm mới dữ liệu (màn hình đang cũ so với server)", async () => {
    vi.spyOn(friendService, "accept").mockRejectedValue(new BusinessApiError(409, "FRIEND_REQUEST_NOT_PENDING", ""));
    const { client } = renderWithQuery(<FriendActionButton userId="u1" status="PENDING_IN" requestId="r2" />);
    const invalidate = vi.spyOn(client, "invalidateQueries");

    fireEvent.click(screen.getByRole("button", { name: "Chấp nhận" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Lời mời này đã được xử lý, vui lòng tải lại trang"));
    await waitFor(() => expect(invalidate).toHaveBeenCalled());
  });
  it("hạn mức chung 10 POST/phút: accept bị 429 không code -> toast nói rõ phải chờ bao lâu, không 'Đã có lỗi' chung", async () => {
    vi.spyOn(friendService, "accept").mockRejectedValue(new RateLimitError(60));
    renderWithQuery(<FriendActionButton userId="u1" status="PENDING_IN" requestId="r2" />);

    fireEvent.click(screen.getByRole("button", { name: "Chấp nhận" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(vi.mocked(toast.error).mock.calls[0][0]).toBe("Bạn thao tác quá nhiều lần, vui lòng thử lại sau 60 giây");
  });

  it("gửi cho người đã chặn mình: BE trả 404 FRIEND_USER_NOT_FOUND -> toast chung, không lộ việc bị chặn", async () => {
    vi.spyOn(friendService, "sendRequest").mockRejectedValue(new BusinessApiError(404, "FRIEND_USER_NOT_FOUND", "x"));
    renderWithQuery(<FriendActionButton userId="u1" status="NONE" name="Lan" />);

    fireEvent.click(screen.getByRole("button", { name: "Kết bạn với Lan" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    const shown = String(vi.mocked(toast.error).mock.calls[0][0]);
    expect(shown).toBe("Không tìm thấy người dùng này");
    expect(shown).not.toMatch(/chặn|block/i);
  });

  it("cooldown 409 có retry_after: toast nói phải chờ bao lâu, vẫn không nói 'huỷ' hay 'từ chối'", async () => {
    vi.spyOn(friendService, "sendRequest").mockRejectedValue(
      new BusinessApiError(409, "FRIEND_REQUEST_COOLDOWN", "x", undefined, 300)
    );
    renderWithQuery(<FriendActionButton userId="u1" status="NONE" name="Lan" />);

    fireEvent.click(screen.getByRole("button", { name: "Kết bạn với Lan" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    const shown = String(vi.mocked(toast.error).mock.calls[0][0]);
    expect(shown).toContain("thử lại sau 5 phút");
    expect(shown).not.toMatch(/huỷ|từ chối/i);
  });
});
