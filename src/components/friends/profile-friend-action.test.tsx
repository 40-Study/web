/**
 * Nút kết bạn ở hồ sơ: theo VAI, không theo route (ProfileHeader dùng chung). Phụ huynh/giáo viên không
 * thấy nút và không bắn API (sẽ 403 FRIEND_ROLE_NOT_ALLOWED).
 */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BusinessApiError } from "@/services/business-request";
import { useAuthStore } from "@/stores/auth.store";
import { renderWithQuery } from "@/test-utils/query-wrapper";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

import { friendService } from "@/services/friend.service";
import { ProfileFriendAction } from "./profile-friend-action";

const setRole = (role: string | null) => useAuthStore.setState({ activeRole: role, isAuthenticated: !!role });

describe("ProfileFriendAction", () => {
  beforeEach(() => {
    vi.spyOn(friendService, "relationship").mockResolvedValue({ status: "NONE" });
  });
  afterEach(() => setRole(null));

  it("STUDENT xem hồ sơ người khác: thấy 'Kết bạn'", async () => {
    setRole("STUDENT");
    renderWithQuery(<ProfileFriendAction userId="u1" name="Lan" />);

    expect(await screen.findByRole("button", { name: "Kết bạn với Lan" })).toBeTruthy();
    expect(friendService.relationship).toHaveBeenCalledWith("u1");
  });

  it.each(["PARENT", "TEACHER", "ADMIN"])("%s: không có nút và KHÔNG gọi API bạn bè", async (role) => {
    setRole(role);
    const { container } = renderWithQuery(<ProfileFriendAction userId="u1" name="Lan" />);
    await new Promise((r) => setTimeout(r, 30));

    expect(container.querySelector("button")).toBeNull();
    expect(friendService.relationship).not.toHaveBeenCalled();
  });

  it("khách (chưa đăng nhập): không có nút, không gọi API", async () => {
    setRole(null);
    const { container } = renderWithQuery(<ProfileFriendAction userId="u1" name="Lan" />);
    await new Promise((r) => setTimeout(r, 30));

    expect(container.querySelector("button")).toBeNull();
    expect(friendService.relationship).not.toHaveBeenCalled();
  });

  it("hồ sơ của chính mình (SELF): không có nút", async () => {
    setRole("STUDENT");
    vi.spyOn(friendService, "relationship").mockResolvedValue({ status: "SELF" });
    const { container } = renderWithQuery(<ProfileFriendAction userId="me" name="Tôi" />);
    await waitFor(() => expect(friendService.relationship).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 30));

    expect(container.querySelector("button")).toBeNull();
  });

  it("người kia không phải học viên (404 FRIEND_USER_NOT_FOUND): không hiện nút", async () => {
    setRole("STUDENT");
    vi.spyOn(friendService, "relationship").mockRejectedValue(new BusinessApiError(404, "FRIEND_USER_NOT_FOUND", ""));
    const { container } = renderWithQuery(<ProfileFriendAction userId="t1" name="Thầy Hùng" />);
    await waitFor(() => expect(friendService.relationship).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 30));

    expect(container.querySelector("button")).toBeNull();
  });

  it("trạng thái theo relationship: FRIENDS -> 'Bạn bè', PENDING_IN -> 'Chấp nhận' dùng request_id của server", async () => {
    setRole("STUDENT");
    const spy = vi.spyOn(friendService, "relationship");

    spy.mockResolvedValue({ status: "FRIENDS" });
    const friends = renderWithQuery(<ProfileFriendAction userId="u1" name="Lan" />);
    expect(await screen.findByRole("button", { name: "Bạn bè với Lan" })).toBeTruthy();
    friends.unmount();

    spy.mockResolvedValue({ status: "PENDING_IN", request_id: "r-77" });
    const accept = vi.spyOn(friendService, "accept").mockResolvedValue({ id: "r-77", status: "ACCEPTED", user: { user_id: "u1", user_name: "lan" } });
    renderWithQuery(<ProfileFriendAction userId="u1" name="Lan" />);
    fireEvent.click(await screen.findByRole("button", { name: "Chấp nhận lời mời của Lan" }));
    await waitFor(() => expect(accept).toHaveBeenCalledWith("r-77"));
  });

  it("có nút Chặn (xác nhận trước khi gọi block), và biến mất khi đã chặn", async () => {
    setRole("STUDENT");
    const block = vi.spyOn(friendService, "block").mockResolvedValue(null);
    const first = renderWithQuery(<ProfileFriendAction userId="u1" name="Lan" />);

    fireEvent.click(await screen.findByRole("button", { name: "Chặn Lan" }));
    expect(block).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Chặn" }));
    await waitFor(() => expect(block).toHaveBeenCalledWith("u1"));
    first.unmount();

    vi.spyOn(friendService, "relationship").mockResolvedValue({ status: "BLOCKED_BY_ME" });
    renderWithQuery(<ProfileFriendAction userId="u1" name="Lan" />);
    expect(await screen.findByRole("button", { name: "Bỏ chặn Lan" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Chặn Lan" })).toBeNull();
  });
});
