/**
 * QA2 PG-M2: tên giảng viên ở trang khoá học là chữ thường, không có trang công khai (/teachers 404,
 * /profile/<id> đá về login). Trang này hiển thị hồ sơ công khai (contract BE3 §3) cho cả khách.
 */

import { Component, type ReactNode } from "react";
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "teacher-1" }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/teachers/teacher-1",
  notFound: nav.notFound,
}));
vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import TeacherPublicProfilePage from "./page";
import { NotFoundError, ApiError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

/** Next bắt NEXT_NOT_FOUND ở ranh giới lỗi của route; ở đây đóng vai ranh giới đó. */
class NotFoundBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <p>trang-404</p> : this.props.children;
  }
}

function renderPage() {
  return renderWithProviders(
    <NotFoundBoundary>
      <TeacherPublicProfilePage />
    </NotFoundBoundary>,
  );
}

const PROFILE = {
  id: "teacher-1",
  user_name: "gv_a",
  full_name: "Trần Thị Giảng Viên",
  avatar_url: null,
  bio: "Mười năm dạy lập trình web.",
  is_verified: true,
  joined_at: "2025-03-02T03:04:05Z",
  specialization: "Lập trình Web",
  education: "Thạc sĩ CNTT",
  experience_years: 10,
  department: null,
  stats: { course_count: 2, student_count: 1234, review_count: 40, average_rating: 4.6 },
  courses: [
    {
      id: "c1", title: "Next.js từ cơ bản", slug: "nextjs-co-ban", short_description: "Học Next.js", thumbnail_url: null,
      level: "beginner", price: 499000, discount_price: null, is_free: false, average_rating: 4.7, total_reviews: 12,
      total_students: 80, total_lessons: 30, total_duration_minutes: 600, published_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "c2", title: "Docker thực chiến", slug: "docker-thuc-chien", short_description: null, thumbnail_url: null,
      level: "intermediate", price: 0, discount_price: null, is_free: true, average_rating: 0, total_reviews: 0,
      total_students: 0, total_lessons: 5, total_duration_minutes: 60, published_at: null,
    },
  ],
};

beforeEach(() => {
  resetMockApi();
  nav.notFound.mockClear();
});

describe("/teachers/[id] — hồ sơ giảng viên công khai (PG-M2)", () => {
  it("hiện tên, xác minh, giới thiệu, chuyên môn, số liệu và các khoá học (link tới trang khoá)", async () => {
    mockApi.get.mockResolvedValue(envelope(PROFILE));
    renderPage();

    expect(await screen.findByRole("heading", { level: 1, name: "Trần Thị Giảng Viên" })).toBeTruthy();
    expect(mockApi.get).toHaveBeenCalledWith("/teachers/teacher-1/public-profile");
    expect(screen.getByText("Đã xác minh")).toBeTruthy();
    expect(screen.getByText("Mười năm dạy lập trình web.")).toBeTruthy();
    expect(screen.getByText("Lập trình Web")).toBeTruthy();
    expect(screen.getByText("Thạc sĩ CNTT")).toBeTruthy();
    expect(screen.getByText(/10 năm kinh nghiệm/)).toBeTruthy();
    // Số liệu
    expect(screen.getByText("1.234")).toBeTruthy();
    expect(screen.getByText("4.6")).toBeTruthy();
    // Khoá học
    const link = screen.getByText("Next.js từ cơ bản").closest("a");
    expect(link?.getAttribute("href")).toBe("/courses/nextjs-co-ban");
    expect(screen.getByText("Docker thực chiến")).toBeTruthy();
  });

  it("trường null (hồ sơ chưa duyệt): không hiện nhãn trống, không hiện 'null'", async () => {
    mockApi.get.mockResolvedValue(
      envelope({ ...PROFILE, bio: null, specialization: null, education: null, experience_years: null, courses: [] }),
    );
    renderPage();
    await screen.findByRole("heading", { level: 1 });

    expect(screen.queryByText(/null/)).toBeNull();
    expect(screen.queryByText("Chuyên môn")).toBeNull();
    expect(screen.queryByText("Học vấn")).toBeNull();
    expect(screen.getByText("Giảng viên này chưa có khoá học nào được xuất bản.")).toBeTruthy();
  });

  it("thiếu full_name: dùng user_name", async () => {
    mockApi.get.mockResolvedValue(envelope({ ...PROFILE, full_name: null }));
    renderPage();
    expect(await screen.findByRole("heading", { level: 1, name: "gv_a" })).toBeTruthy();
  });

  it("404 (không phải giảng viên đang hoạt động) -> notFound()", async () => {
    mockApi.get.mockRejectedValue(new NotFoundError("Teacher not found"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      renderPage();
      expect(await screen.findByText("trang-404")).toBeTruthy();
      expect(nav.notFound).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it("400 (id sai định dạng) cũng là 404, không hiện lỗi kỹ thuật", async () => {
    mockApi.get.mockRejectedValue(new ApiError(400, "UNKNOWN", "invalid UUID length: 14"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      renderPage();
      expect(await screen.findByText("trang-404")).toBeTruthy();
      expect(screen.queryByText(/invalid UUID/)).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  it("lỗi mạng/máy chủ: báo lỗi có nút Thử lại (không phải 404)", async () => {
    mockApi.get.mockRejectedValueOnce(new ApiError(500, "UNKNOWN", "boom")).mockResolvedValueOnce(envelope(PROFILE));
    renderPage();

    const retry = await screen.findByRole("button", { name: "Thử lại" });
    expect(nav.notFound).not.toHaveBeenCalled();
    fireEvent.click(retry);
    expect(await screen.findByRole("heading", { level: 1, name: "Trần Thị Giảng Viên" })).toBeTruthy();
  });
});
