/** Tab Bạn bè / Lời mời / Đã chặn: hành động trên từng dòng gọi đúng API, có xác nhận với việc khó hoàn tác. */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

import { conversationService } from "@/services/conversation.service";
import { friendService } from "@/services/friend.service";
import { BlockedList } from "./blocked-list";
import { FriendList } from "./friend-list";
import { RequestList } from "./request-list";

const lan = { user_id: "u-lan", user_name: "lan", full_name: "Nguyễn Lan" };
const binh = { user_id: "u-binh", user_name: "binh" };

describe("FriendList", () => {
  beforeEach(() => {
    router.push.mockReset();
    vi.spyOn(friendService, "list").mockResolvedValue({
      friends: [{ friendship_id: "f1", user: lan, since: "2026-09-01T00:00:00Z" }],
      total_count: 1,
      page: 1,
      limit: 20,
    });
  });

  it("hiện họ tên đầy đủ (không phải email) và ngày kết bạn", async () => {
    renderWithQuery(<FriendList />);

    expect(await screen.findByText("Nguyễn Lan")).toBeTruthy();
    expect(screen.getByText(/Bạn bè từ/)).toBeTruthy();
  });

  it("thiếu full_name thì rơi về user_name", async () => {
    vi.spyOn(friendService, "list").mockResolvedValue({
      friends: [{ friendship_id: "f2", user: binh, since: "2026-09-01T00:00:00Z" }],
      total_count: 1,
      page: 1,
      limit: 20,
    });
    renderWithQuery(<FriendList />);

    expect(await screen.findByText("binh")).toBeTruthy();
  });

  it("Nhắn tin: tạo hội thoại trực tiếp rồi mở /messages?conversation=<id>", async () => {
    const createDirect = vi
      .spyOn(conversationService, "createDirect")
      .mockResolvedValue({ id: "conv-5" } as never);
    renderWithQuery(<FriendList />);

    fireEvent.click(await screen.findByRole("button", { name: "Nhắn tin cho Nguyễn Lan" }));

    await waitFor(() => expect(createDirect).toHaveBeenCalledWith("u-lan"));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/messages?conversation=conv-5"));
  });

  it("Huỷ kết bạn phải qua xác nhận", async () => {
    const unfriend = vi.spyOn(friendService, "unfriend").mockResolvedValue(null);
    renderWithQuery(<FriendList />);

    fireEvent.click(await screen.findByRole("button", { name: "Huỷ kết bạn với Nguyễn Lan" }));
    expect(unfriend).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Huỷ kết bạn" }));

    await waitFor(() => expect(unfriend).toHaveBeenCalledWith("u-lan"));
  });

  it("Chặn phải qua xác nhận", async () => {
    const block = vi.spyOn(friendService, "block").mockResolvedValue(null);
    renderWithQuery(<FriendList />);

    fireEvent.click(await screen.findByRole("button", { name: "Chặn Nguyễn Lan" }));
    expect(block).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Chặn" }));

    await waitFor(() => expect(block).toHaveBeenCalledWith("u-lan"));
  });

  it("chưa có bạn: trạng thái rỗng hướng dẫn sang 'Tìm người'", async () => {
    vi.spyOn(friendService, "list").mockResolvedValue({ friends: [], total_count: 0, page: 1, limit: 20 });
    renderWithQuery(<FriendList />);

    expect(await screen.findByText("Bạn chưa có bạn bè nào")).toBeTruthy();
    expect(screen.getByText(/Tìm người/)).toBeTruthy();
  });
});

describe("RequestList", () => {
  beforeEach(() => {
    vi.spyOn(friendService, "summary").mockResolvedValue({ friends_count: 0, incoming_requests: 2, outgoing_requests: 1 });
    vi.spyOn(friendService, "requests").mockImplementation(async ({ direction }) => ({
      requests:
        direction === "incoming"
          ? [{ id: "r-in", direction: "incoming", user: lan, created_at: "2026-09-02T00:00:00Z" }]
          : [{ id: "r-out", direction: "outgoing", user: binh, created_at: "2026-09-02T00:00:00Z" }],
      total_count: 1,
      page: 1,
      limit: 20,
    }));
  });

  it("mặc định là 'Nhận được' kèm số từ /friends/summary; Chấp nhận / Từ chối gọi đúng id", async () => {
    const accept = vi.spyOn(friendService, "accept").mockResolvedValue({ id: "r-in", status: "ACCEPTED", user: lan });
    const decline = vi.spyOn(friendService, "decline").mockResolvedValue({ id: "r-in", status: "DECLINED" });
    renderWithQuery(<RequestList />);

    expect(await screen.findByText("Nguyễn Lan")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Nhận được \(2\)/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Chấp nhận lời mời của Nguyễn Lan" }));
    await waitFor(() => expect(accept).toHaveBeenCalledWith("r-in"));
    fireEvent.click(screen.getByRole("button", { name: "Từ chối lời mời của Nguyễn Lan" }));
    await waitFor(() => expect(decline).toHaveBeenCalledWith("r-in"));
  });

  it("'Đã gửi': chỉ có Huỷ lời mời (không có Chấp nhận/Từ chối) và gọi cancel", async () => {
    const cancel = vi.spyOn(friendService, "cancel").mockResolvedValue(null);
    renderWithQuery(<RequestList />);

    fireEvent.click(await screen.findByRole("button", { name: /Đã gửi \(1\)/ }));
    await screen.findByText("binh");

    expect(screen.queryByRole("button", { name: /Chấp nhận|Từ chối/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Huỷ lời mời gửi binh" }));
    await waitFor(() => expect(cancel).toHaveBeenCalledWith("r-out"));
  });

  it("không có lời mời: trạng thái rỗng", async () => {
    vi.spyOn(friendService, "requests").mockResolvedValue({ requests: [], total_count: 0, page: 1, limit: 20 });
    renderWithQuery(<RequestList />);

    expect(await screen.findByText("Không có lời mời nào")).toBeTruthy();
  });
});

describe("BlockedList", () => {
  it("Bỏ chặn gọi unblock đúng người", async () => {
    vi.spyOn(friendService, "blocks").mockResolvedValue({
      blocks: [{ user: binh, created_at: "2026-09-01T00:00:00Z" }],
      total_count: 1,
      page: 1,
      limit: 20,
    });
    const unblock = vi.spyOn(friendService, "unblock").mockResolvedValue(null);
    renderWithQuery(<BlockedList />);

    fireEvent.click(await screen.findByRole("button", { name: "Bỏ chặn binh" }));

    await waitFor(() => expect(unblock).toHaveBeenCalledWith("u-binh"));
  });

  it("chưa chặn ai: trạng thái rỗng", async () => {
    vi.spyOn(friendService, "blocks").mockResolvedValue({ blocks: [], total_count: 0, page: 1, limit: 20 });
    renderWithQuery(<BlockedList />);

    expect(await screen.findByText("Bạn chưa chặn ai")).toBeTruthy();
  });
});
