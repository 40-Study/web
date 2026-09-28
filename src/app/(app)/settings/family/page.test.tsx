/**
 * Review #38 W1 — trang Gia đình của HỌC SINH phải lấy "ai đang liên kết" từ /family/parents
 * (quan hệ active), không suy từ lời mời "accepted":
 *  (a) con đã huỷ liên kết: không còn chữ "Đã liên kết" nào dựa trên lời mời cũ;
 *  (b) liên kết tạo qua yêu cầu của phụ huynh (không có lời mời): không hiện empty state
 *      "chưa kết nối với thành viên gia đình nào".
 */

import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import FamilySettingsPage from "./page";
import { useAuthStore } from "@/stores/auth.store";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const PARENT = { id: "p-1", username: "ph1", full_name: "Phụ Huynh Một", email: "ph1@demo.com", relationship: "parent" };
const ACCEPTED_INVITE = {
  id: "inv-1", student_user_id: "s-1", invitee_email: "ph1@demo.com", relationship: "parent",
  status: "accepted", created_at: "2026-09-20T10:00:00+07:00", expires_at: "2026-09-27T10:00:00+07:00",
};

function serve({ parents, invitations }: { parents: unknown[]; invitations: unknown[] }) {
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/family/parents") return envelope(parents);
    if (url === "/invitations/sent") return envelope(invitations);
    if (url === "/family/link-requests/incoming" || url === "/invitations/pending") return envelope([]);
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
}

beforeEach(() => {
  resetMockApi();
  useAuthStore.setState({ activeRole: "STUDENT" } as never);
});

describe("/settings/family — học sinh: nguồn sự thật của liên kết là /family/parents", () => {
  it("(a) đã huỷ liên kết: lời mời 'accepted' cũ không làm trang ghi 'Đã liên kết'", async () => {
    serve({ parents: [], invitations: [ACCEPTED_INVITE] });
    renderWithProviders(<FamilySettingsPage />);
    await screen.findByText("Chưa có lời mời nào");
    expect(screen.queryByText(/Đã liên kết/)).toBeNull();
    expect(screen.queryByText("Phụ huynh đang liên kết")).toBeNull();
  });

  it("(b) liên kết qua yêu cầu của phụ huynh: hiện phụ huynh, KHÔNG hiện empty state", async () => {
    serve({ parents: [PARENT], invitations: [] });
    renderWithProviders(<FamilySettingsPage />);
    await screen.findByText("Phụ huynh đang liên kết");
    expect(screen.getByText("Phụ Huynh Một")).toBeTruthy();
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledWith("/invitations/sent"));
    expect(screen.queryByText("Chưa có lời mời nào")).toBeNull();
    expect(screen.queryByText(/chưa kết nối với thành viên gia đình nào/)).toBeNull();
  });

  it("lời mời đã chấp nhận chỉ còn là lịch sử, không phải mục 'Đã liên kết'", async () => {
    serve({ parents: [PARENT], invitations: [ACCEPTED_INVITE] });
    renderWithProviders(<FamilySettingsPage />);
    await screen.findByText("Lịch sử (1)");
    expect(screen.queryByText(/Đã liên kết \(/)).toBeNull();
  });

  it("lỗi tải /family/parents hiện báo lỗi kèm Thử lại, không im lặng", async () => {
    mockApi.get.mockImplementation(async (url: string) => {
      if (url === "/family/parents") throw new Error("boom");
      return envelope([]);
    });
    renderWithProviders(<FamilySettingsPage />);
    expect(await screen.findByText(/Không tải được danh sách phụ huynh đang liên kết/)).toBeTruthy();
    // W-a (vòng 2): không đọc được thì không được khẳng định "chưa kết nối với ai".
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledWith("/invitations/sent"));
    expect(screen.queryByText("Chưa có lời mời nào")).toBeNull();
    expect(screen.queryByText(/chưa kết nối với thành viên gia đình nào/)).toBeNull();
  });

  it("lỗi tải yêu cầu đến hiện báo lỗi (học sinh phải biết có thể đang có yêu cầu chờ)", async () => {
    mockApi.get.mockImplementation(async (url: string) => {
      if (url === "/family/link-requests/incoming") throw new Error("boom");
      return envelope([]);
    });
    renderWithProviders(<FamilySettingsPage />);
    expect(await screen.findByText(/Không tải được yêu cầu liên kết từ phụ huynh/)).toBeTruthy();
  });
});
