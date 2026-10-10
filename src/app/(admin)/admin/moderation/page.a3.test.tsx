/**
 * A3 (QA 261008): cột "Đối tượng bị báo cáo" phải hiện TÊN + link xem trước thay vì chỉ UUID thô.
 *  - course → tên khoá, link /admin/courses
 *  - user   → tên user, link /admin/users/:id
 *  - discussion → tiêu đề (không link: route xem dự án nằm trong layout học viên)
 *  - loại chưa tra được → rơi về UUID
 *
 * Lưu ý: factory của vi.mock được hoist lên đầu file nên KHÔNG tham chiếu biến const bên ngoài
 * (sẽ TDZ) — mọi giá trị dùng thẳng trong factory.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const COURSE_ID = "5dfbe3d3-8517-495a-ad3a-7ab2af5d0689";
const USER_ID = "37362aff-6e6e-4366-bbfd-101781d79696";
const REVIEW_ID = "11111111-2222-3333-4444-555555555555";

vi.mock("@/hooks/queries/use-reports", () => ({
  useAllReports: () => ({
    data: {
      data: [
        { id: "r1", reporter_id: "x", reported_type: "course", reported_id: "5dfbe3d3-8517-495a-ad3a-7ab2af5d0689", reason: "copyright", status: "pending" },
        { id: "r2", reporter_id: "x", reported_type: "user", reported_id: "37362aff-6e6e-4366-bbfd-101781d79696", reason: "spam", status: "pending" },
        { id: "r3", reporter_id: "x", reported_type: "discussion", reported_id: "4797a301-b7fc-41fd-b49d-128588037989", reason: "harassment", status: "pending" },
        { id: "r4", reporter_id: "x", reported_type: "review", reported_id: "11111111-2222-3333-4444-555555555555", reason: "other", status: "pending" },
      ],
      total: 4,
      page: 1,
      page_size: 50,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpdateReportStatus: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/services/user.service", () => ({
  userService: {
    getById: vi.fn(async (id: string) => ({
      id,
      user_name: "student2",
      full_name: "Phạm Thị D",
      email: "student2@demo.com",
    })),
  },
}));

vi.mock("@/services/course.service", () => ({
  courseService: {
    getCourseById: vi.fn(async (id: string) => ({
      id,
      title: "Flutter Mobile Development",
      slug: "flutter-mobile-development",
    })),
  },
}));

vi.mock("@/services/discussion.service", () => ({
  discussionService: {
    listPosts: vi.fn(async () => ({
      posts: [{ id: "4797a301-b7fc-41fd-b49d-128588037989", slug: "loi-cors", title: "Lỗi CORS khi gọi API" }],
      total: 1,
      page: 1,
      page_size: 100,
    })),
  },
}));

// eslint-disable-next-line import/first
import AdminModerationPage from "./page";

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdminModerationPage />
    </QueryClientProvider>
  );
}

describe("/admin/moderation — A3: đối tượng bị báo cáo có tên + link", () => {
  beforeEach(() => vi.clearAllMocks());

  it("course hiện tên khoá + link tới trang duyệt khoá", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Flutter Mobile Development")).toBeTruthy());
    const link = screen.getByText("Flutter Mobile Development").closest("a");
    expect(link?.getAttribute("href")).toBe("/admin/courses");
  });

  it("user hiện tên + link tới chi tiết user", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Phạm Thị D")).toBeTruthy());
    const link = screen.getByText("Phạm Thị D").closest("a");
    expect(link?.getAttribute("href")).toBe(`/admin/users/${USER_ID}`);
  });

  it("discussion hiện tiêu đề (không link tới route học viên)", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Lỗi CORS khi gọi API")).toBeTruthy());
    expect(screen.getByText("Lỗi CORS khi gọi API").closest("a")).toBeNull();
  });

  it("loại chưa tra được (review) rơi về UUID thô", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(REVIEW_ID)).toBeTruthy());
  });
});
