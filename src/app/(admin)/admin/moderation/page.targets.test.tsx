/**
 * A3 (QA 261008) + ADM-N4/A3 (QA2 261013): cột "Đối tượng bị báo cáo" hiện TÊN + link tới đối tượng, và quản trị
 * viên xử lý được NGAY từ báo cáo (gỡ khoá học / ẩn bài thảo luận) thay vì chỉ đổi trạng thái.
 *
 * Dữ liệu đối tượng lấy từ `report.target` của backend (contract BE3 §1a), thay cho các lượt tra theo id trước
 * đây. Nút hành động dựng từ `target.available_actions`, không suy từ loại đối tượng.
 */

import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from "sonner";
import { ApiError } from "@/lib/errors";
import AdminModerationPage from "./page";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const COURSE_ID = "5dfbe3d3-8517-495a-ad3a-7ab2af5d0689";
const USER_ID = "37362aff-6e6e-4366-bbfd-101781d79696";
const REVIEW_ID = "11111111-2222-3333-4444-555555555555";

const base = { reporter_id: "x", reporter_name: "Học viên A", status: "pending", created_at: "2026-10-12T00:00:00Z" };

function target(over: Record<string, unknown>) {
  return {
    exists: true,
    name: null,
    status: null,
    slug: null,
    course_id: null,
    course_slug: null,
    owner_id: null,
    available_actions: [],
    ...over,
  };
}

const REPORTS = [
  {
    ...base, id: "r-course", reported_type: "course", reported_id: COURSE_ID, reason: "copyright",
    target: target({ type: "course", id: COURSE_ID, name: "Flutter Mobile Development", status: "published", slug: "flutter-mobile-development", available_actions: ["unpublish_course"] }),
  },
  {
    ...base, id: "r-user", reported_type: "user", reported_id: USER_ID, reason: "spam",
    target: target({ type: "user", id: USER_ID, name: "Phạm Thị D", status: "active", owner_id: USER_ID }),
  },
  {
    ...base, id: "r-disc", reported_type: "discussion", reported_id: "d1", reason: "harassment",
    target: target({ type: "discussion", id: "d1", name: "Lỗi CORS khi gọi API", status: "visible", slug: "loi-cors", available_actions: ["hide_discussion"] }),
  },
  {
    ...base, id: "r-disc-hidden", reported_type: "discussion", reported_id: "d2", reason: "spam",
    target: target({ type: "discussion", id: "d2", name: "Bài đã ẩn", status: "hidden", slug: "bai-da-an", available_actions: ["unhide_discussion"] }),
  },
  {
    ...base, id: "r-review", reported_type: "review", reported_id: REVIEW_ID, reason: "other",
    target: target({ type: "review", id: REVIEW_ID, name: "Khoá học quá tệ", course_id: "c9", course_slug: "khoa-hoc-9" }),
  },
  {
    ...base, id: "r-gone", reported_type: "course", reported_id: "gone-id", reason: "other",
    target: target({ type: "course", id: "gone-id", exists: false }),
  },
  { ...base, id: "r-legacy", reported_type: "lesson", reported_id: "legacy-uuid-1234", reason: "other" },
];

beforeEach(() => {
  resetMockApi();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
  mockApi.get.mockResolvedValue(envelope({ data: REPORTS, total: REPORTS.length, page: 1, page_size: 50 }));
});

async function renderPage() {
  const utils = renderWithProviders(<AdminModerationPage />);
  await screen.findByText("Flutter Mobile Development");
  return utils;
}

/** Hàng của báo cáo trong bảng (tìm theo văn bản đối tượng) rồi bấm "Xem". */
async function openReport(objectText: string) {
  const row = screen.getByText(objectText).closest("tr") as HTMLElement;
  fireEvent.click(within(row).getByRole("button", { name: "Xem" }));
}

describe("/admin/moderation — đối tượng bị báo cáo có tên + link (A3, ADM-N4)", () => {
  it("hiện tên từ target, không còn lộ UUID, và không gọi thêm API tra cứu theo id", async () => {
    await renderPage();
    for (const name of ["Flutter Mobile Development", "Phạm Thị D", "Lỗi CORS khi gọi API", "Khoá học quá tệ"]) {
      expect(screen.getByText(name)).toBeTruthy();
    }
    expect(screen.queryByText(COURSE_ID)).toBeNull();
    // Chỉ GET /reports; trước đây mỗi user/course có thêm một lượt GET /users/:id, /courses/:id.
    expect(mockApi.get.mock.calls.every((c) => c[0] === "/reports")).toBe(true);
  });

  it("link tới đúng nơi: khoá đã xuất bản -> trang công khai, user -> trang admin, thảo luận -> /discussions/:slug, review -> khoá chứa nó", async () => {
    await renderPage();
    const href = (text: string) => screen.getByText(text).closest("a")?.getAttribute("href");
    expect(href("Flutter Mobile Development")).toBe("/courses/flutter-mobile-development");
    expect(href("Phạm Thị D")).toBe(`/admin/users/${USER_ID}`);
    expect(href("Lỗi CORS khi gọi API")).toBe("/discussions/loi-cors");
    expect(href("Khoá học quá tệ")).toBe("/courses/khoa-hoc-9");
  });

  it("đối tượng đã bị xoá: báo rõ, không link, không nút hành động", async () => {
    await renderPage();
    const row = screen.getByText("Đối tượng đã bị xoá").closest("tr") as HTMLElement;
    expect(within(row).queryByRole("link")).toBeNull();
    fireEvent.click(within(row).getByRole("button", { name: "Xem" }));
    expect(screen.queryByRole("button", { name: /Gỡ khoá học|Ẩn bài thảo luận|Hiện lại bài thảo luận/ })).toBeNull();
  });

  it("báo cáo không có target (backend cũ): rơi về UUID thô như trước", async () => {
    await renderPage();
    expect(screen.getByText("legacy-uuid-1234")).toBeTruthy();
  });
});

describe("/admin/moderation — hành động trên đối tượng (ADM-N4)", () => {
  it("khoá học đã xuất bản: nút 'Gỡ khoá học khỏi danh mục' bắt nhập lý do, rồi POST /reports/:id/actions", async () => {
    mockApi.post.mockResolvedValue(envelope({ action: "unpublish_course", report: { ...REPORTS[0], status: "resolved" } }));
    await renderPage();
    await openReport("Flutter Mobile Development");

    fireEvent.click(screen.getByRole("button", { name: "Gỡ khoá học khỏi danh mục" }));
    const confirm = screen.getByRole("button", { name: "Xác nhận gỡ khoá học" }) as HTMLButtonElement;
    // Lý do trống/quá ngắn: chưa gửi được.
    expect(confirm.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Lý do (gửi cho giảng viên)"), { target: { value: "ab" } });
    expect(confirm.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Lý do (gửi cho giảng viên)"), { target: { value: "  Vi phạm bản quyền  " } });
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
    expect(mockApi.post).toHaveBeenCalledWith("/reports/r-course/actions", {
      action: "unpublish_course",
      reason: "Vi phạm bản quyền",
      resolve: true,
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Đã gỡ khoá học khỏi danh mục"));
    // Làm mới danh sách báo cáo (đối tượng đổi trạng thái).
    await waitFor(() => expect(mockApi.get.mock.calls.length).toBeGreaterThan(1));
  });

  it("bỏ tick 'đồng thời đánh dấu đã xử lý' thì gửi resolve:false", async () => {
    mockApi.post.mockResolvedValue(envelope({ action: "unpublish_course", report: REPORTS[0] }));
    await renderPage();
    await openReport("Flutter Mobile Development");
    fireEvent.click(screen.getByRole("button", { name: "Gỡ khoá học khỏi danh mục" }));
    fireEvent.change(screen.getByLabelText("Lý do (gửi cho giảng viên)"), { target: { value: "Vi phạm" } });
    fireEvent.click(screen.getByLabelText("Đồng thời đánh dấu báo cáo đã xử lý"));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận gỡ khoá học" }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalled());
    expect(mockApi.post.mock.calls[0][1]).toMatchObject({ resolve: false });
  });

  it("thảo luận đang hiện: 'Ẩn bài thảo luận' cần lý do; thảo luận đã ẩn: 'Hiện lại' không cần lý do", async () => {
    mockApi.post.mockResolvedValue(envelope({ action: "hide_discussion", report: REPORTS[2] }));
    await renderPage();

    await openReport("Lỗi CORS khi gọi API");
    fireEvent.click(screen.getByRole("button", { name: "Ẩn bài thảo luận" }));
    fireEvent.change(screen.getByLabelText("Lý do"), { target: { value: "Ngôn từ quấy rối" } });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận ẩn bài" }));
    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith("/reports/r-disc/actions", {
      action: "hide_discussion", reason: "Ngôn từ quấy rối", resolve: true,
    }));
  });

  it("hiện lại thảo luận đã ẩn: không có ô lý do, gửi action unhide_discussion không kèm reason", async () => {
    mockApi.post.mockResolvedValue(envelope({ action: "unhide_discussion", report: REPORTS[3] }));
    await renderPage();
    await openReport("Bài đã ẩn");

    fireEvent.click(screen.getByRole("button", { name: "Hiện lại bài thảo luận" }));
    expect(screen.queryByLabelText("Lý do")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận hiện lại bài" }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
    expect(mockApi.post).toHaveBeenCalledWith("/reports/r-disc-hidden/actions", { action: "unhide_discussion", resolve: true });
  });

  it("user: không có nút gỡ/ẩn, chỉ có lối sang trang người dùng để khoá tài khoản", async () => {
    await renderPage();
    await openReport("Phạm Thị D");
    expect(screen.queryByRole("button", { name: /Gỡ khoá học|Ẩn bài thảo luận|Hiện lại/ })).toBeNull();
    const manage = screen.getByRole("link", { name: "Mở trang người dùng để khoá tài khoản" });
    expect(manage.getAttribute("href")).toBe(`/admin/users/${USER_ID}`);
  });

  it("lỗi 409 TARGET_STATE_UNCHANGED: báo tiếng Việt, làm mới danh sách vì trạng thái đã đổi", async () => {
    mockApi.post.mockRejectedValue(new ApiError(409, "TARGET_STATE_UNCHANGED", "target not in actionable state"));
    await renderPage();
    await openReport("Flutter Mobile Development");
    fireEvent.click(screen.getByRole("button", { name: "Gỡ khoá học khỏi danh mục" }));
    fireEvent.change(screen.getByLabelText("Lý do (gửi cho giảng viên)"), { target: { value: "Vi phạm" } });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận gỡ khoá học" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(String(vi.mocked(toast.error).mock.calls[0][0])).toMatch(/đã thay đổi|không còn ở trạng thái/);
    expect(toast.success).not.toHaveBeenCalled();
    await waitFor(() => expect(mockApi.get.mock.calls.length).toBeGreaterThan(1));
  });

  it("báo cáo biến mất sau lỗi 409 (đã xử lý nơi khác): mở báo cáo khác không bật lại hộp thoại cũ", async () => {
    mockApi.post.mockRejectedValue(new ApiError(409, "TARGET_STATE_UNCHANGED", "x"));
    await renderPage();
    await openReport("Flutter Mobile Development");
    fireEvent.click(screen.getByRole("button", { name: "Gỡ khoá học khỏi danh mục" }));
    fireEvent.change(screen.getByLabelText("Lý do (gửi cho giảng viên)"), { target: { value: "Vi phạm" } });
    // Danh sách tải lại sẽ không còn báo cáo khoá học.
    mockApi.get.mockResolvedValue(envelope({ data: REPORTS.slice(1), total: 6, page: 1, page_size: 50 }));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận gỡ khoá học" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText("Flutter Mobile Development")).toBeNull());

    await openReport("Lỗi CORS khi gọi API");
    expect(screen.queryByText("Gỡ khoá học khỏi danh mục?")).toBeNull();
  });

  it("các nút trạng thái cũ vẫn còn (đánh dấu đã xử lý / từ chối)", async () => {
    await renderPage();
    await openReport("Flutter Mobile Development");
    expect(screen.getByRole("button", { name: "Đánh dấu đã xử lý" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Từ chối báo cáo" })).toBeTruthy();
  });
});
