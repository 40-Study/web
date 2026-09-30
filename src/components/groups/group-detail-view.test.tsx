/**
 * Trang chi tiết nhóm: 404 (SECRET với người ngoài) hiện y hệt slug không tồn tại, và tab nào hiện
 * theo (privacy, vai trò) đúng như ma trận phase 03.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, NotFoundError } from "@/lib/errors";
import { useAuthStore } from "@/stores/auth.store";
import { renderWithQuery } from "@/test-utils/query-wrapper";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));
// Chat có WebSocket riêng (test ở use-conversation-socket); ở đây chỉ cần biết tab có render hay không.
vi.mock("@/components/chat/conversation-chat", () => ({
  ConversationChat: ({ conversationId }: { conversationId: string }) => <div>chat-stub:{conversationId}</div>,
}));

import { groupService, type Group } from "@/services/group.service";
import { GroupDetailView } from "./group-detail-view";

function makeGroup(over: Partial<Group> = {}): Group {
  return {
    id: "g1",
    name: "Nhóm React",
    slug: "nhom-react",
    description: "Học React cùng nhau",
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

const tabNames = () => screen.getAllByRole("tab").map((t) => (t.textContent ?? "").trim());

function mockLists() {
  vi.spyOn(groupService, "listMembers").mockResolvedValue({ members: [], total_count: 0 });
  vi.spyOn(groupService, "listJoinRequests").mockResolvedValue({
    requests: [
      { id: "r1", group_id: "g1", user_id: "u1", user_name: "An", status: "PENDING", created_at: "2026-09-02T00:00:00Z" },
      { id: "r2", group_id: "g1", user_id: "u2", user_name: "Bình", status: "PENDING", created_at: "2026-09-02T00:00:00Z" },
    ],
    total_count: 2,
  });
}

describe("GroupDetailView", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: "me" } as never, isAuthenticated: true, activeRole: "STUDENT" });
    mockLists();
  });
  afterEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, activeRole: null });
  });

  it("nhóm SECRET với người ngoài (404) và slug sai cho ra CÙNG một trang 'Không tìm thấy nhóm'", async () => {
    const spy = vi.spyOn(groupService, "getBySlug");

    spy.mockRejectedValue(new NotFoundError("Group not found"));
    const secret = renderWithQuery(<GroupDetailView slug="nhom-bi-mat" />);
    await screen.findByText("Không tìm thấy nhóm");
    const secretHtml = secret.container.innerHTML;
    secret.unmount();

    spy.mockRejectedValue(new NotFoundError("something else entirely"));
    const missing = renderWithQuery(<GroupDetailView slug="khong-ton-tai" />);
    await screen.findByText("Không tìm thấy nhóm");

    expect(missing.container.innerHTML).toBe(secretHtml);
  });

  it("lỗi khác 404 (vd. 500) KHÔNG giả làm 'không tìm thấy': hiện lỗi tải kèm Thử lại", async () => {
    vi.spyOn(groupService, "getBySlug").mockRejectedValue(new ApiError(500, "UNKNOWN", "boom"));
    renderWithQuery(<GroupDetailView slug="nhom-react" />);

    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
    expect(screen.queryByText("Không tìm thấy nhóm")).toBeNull();
  });

  it("người ngoài + PRIVATE: chỉ có tab Tổng quan (ẩn Thành viên, Trò chuyện, Quản lý)", async () => {
    vi.spyOn(groupService, "getBySlug").mockResolvedValue(makeGroup({ privacy: "PRIVATE" }));
    renderWithQuery(<GroupDetailView slug="nhom-react" />);

    await screen.findByRole("heading", { name: "Nhóm React" });
    expect(tabNames()).toEqual(["Tổng quan"]);
    expect(screen.getByRole("button", { name: /Xin tham gia/ })).toBeTruthy();
  });

  it("người ngoài + PUBLIC: có Thành viên, không có Trò chuyện / Quản lý", async () => {
    vi.spyOn(groupService, "getBySlug").mockResolvedValue(makeGroup({ privacy: "PUBLIC" }));
    renderWithQuery(<GroupDetailView slug="nhom-react" />);

    await screen.findByRole("heading", { name: "Nhóm React" });
    expect(tabNames()).toEqual(["Tổng quan", "Thành viên"]);
  });

  it("thành viên thường: Tổng quan, Thành viên, Trò chuyện; KHÔNG có Quản lý; mở chat bằng đúng conversation id", async () => {
    vi.spyOn(groupService, "getBySlug").mockResolvedValue(
      makeGroup({ privacy: "PRIVATE", my_role: "MEMBER", conversation: { id: "conv-9" } })
    );
    renderWithQuery(<GroupDetailView slug="nhom-react" />);

    await screen.findByRole("heading", { name: "Nhóm React" });
    expect(tabNames()).toEqual(["Tổng quan", "Thành viên", "Trò chuyện"]);

    fireEvent.click(screen.getByRole("tab", { name: "Trò chuyện" }));
    expect(screen.getByText("chat-stub:conv-9")).toBeTruthy();
  });

  it("thành viên nhưng nhóm chưa có conversation: không có tab Trò chuyện", async () => {
    vi.spyOn(groupService, "getBySlug").mockResolvedValue(makeGroup({ my_role: "MEMBER" }));
    renderWithQuery(<GroupDetailView slug="nhom-react" />);

    await screen.findByRole("heading", { name: "Nhóm React" });
    expect(tabNames()).not.toContain("Trò chuyện");
  });

  it("MODERATOR nhóm PRIVATE: có Quản lý kèm số yêu cầu chờ; MODERATOR nhóm PUBLIC: không có", async () => {
    const spy = vi.spyOn(groupService, "getBySlug");

    spy.mockResolvedValue(makeGroup({ privacy: "PRIVATE", my_role: "MODERATOR" }));
    const priv = renderWithQuery(<GroupDetailView slug="nhom-react" />);
    await waitFor(() => expect(tabNames()).toContain("Quản lý (2)"));
    priv.unmount();

    spy.mockResolvedValue(makeGroup({ privacy: "PUBLIC", my_role: "MODERATOR" }));
    renderWithQuery(<GroupDetailView slug="nhom-react" />);
    await screen.findByRole("heading", { name: "Nhóm React" });
    expect(tabNames().some((n) => n.startsWith("Quản lý"))).toBe(false);
  });

  it("MEMBER nhóm PRIVATE không gọi API yêu cầu xin vào (người duyệt mới được)", async () => {
    vi.spyOn(groupService, "getBySlug").mockResolvedValue(makeGroup({ privacy: "PRIVATE", my_role: "MEMBER" }));
    renderWithQuery(<GroupDetailView slug="nhom-react" />);

    await screen.findByRole("heading", { name: "Nhóm React" });
    expect(groupService.listJoinRequests).not.toHaveBeenCalled();
  });

  it("OWNER: tab Quản lý có đủ mục, và 'Xoá nhóm' nằm trong Cài đặt", async () => {
    vi.spyOn(groupService, "getBySlug").mockResolvedValue(makeGroup({ privacy: "PRIVATE", my_role: "OWNER" }));
    renderWithQuery(<GroupDetailView slug="nhom-react" />);

    await screen.findByRole("heading", { name: "Nhóm React" });
    fireEvent.click(await screen.findByRole("tab", { name: /Quản lý/ }));
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(
      expect.arrayContaining(["Yêu cầu tham gia (2)", "Thành viên", "Bị cấm", "Cài đặt"])
    );

    fireEvent.click(screen.getByRole("tab", { name: "Cài đặt" }));
    expect(screen.getByRole("button", { name: "Xoá nhóm" })).toBeTruthy();
  });

  it("ADMIN: có Cài đặt nhưng KHÔNG có 'Xoá nhóm'", async () => {
    vi.spyOn(groupService, "getBySlug").mockResolvedValue(makeGroup({ privacy: "PRIVATE", my_role: "ADMIN" }));
    renderWithQuery(<GroupDetailView slug="nhom-react" />);

    await screen.findByRole("heading", { name: "Nhóm React" });
    fireEvent.click(await screen.findByRole("tab", { name: /Quản lý/ }));
    fireEvent.click(screen.getByRole("tab", { name: "Cài đặt" }));

    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Xoá nhóm" })).toBeNull();
  });
});
