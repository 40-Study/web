/**
 * F1 (QA vòng 2): khách chưa đăng nhập mở bài "Xem thử" phải gọi endpoint CÔNG KHAI
 * `/courses/:slug/preview-lessons/:id/contents` (route cũ `/lessons/:id/contents` luôn 401 với
 * khách), còn bài khoá thì không gọi API nào và không hiện nhầm "Chưa có nội dung".
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

// eslint-disable-next-line import/first
import { CourseSyllabus } from "./course-syllabus";
// eslint-disable-next-line import/first
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

const SECTIONS = [
  {
    id: "s1",
    title: "Chương 1",
    duration: 20,
    order: 1,
    lessons: [
      { id: "11111111-1111-4111-8111-111111111111", title: "Bài xem thử", duration: 10, type: "video" as const, isFreePreview: true, order: 1 },
      { id: "22222222-2222-4222-8222-222222222222", title: "Bài trả phí", duration: 10, type: "video" as const, isFreePreview: false, order: 2 },
    ],
  },
];

function renderSyllabus(isEnrolled = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CourseSyllabus sections={SECTIONS} isEnrolled={isEnrolled} courseSlug="khoa-demo" showTrialLinks />
    </QueryClientProvider>
  );
}

describe("CourseSyllabus — khách xem thử", () => {
  beforeEach(() => {
    resetMockApi();
  });

  it("mở bài preview: gọi endpoint công khai theo slug và hiện nội dung", async () => {
    mockApi.get.mockResolvedValue(
      envelope([{ id: "c1", lesson_id: "x", type: "video", title: "Video giới thiệu", video_url: "https://cdn/x.mp4", display_order: 0 }])
    );
    renderSyllabus(false);

    fireEvent.click(screen.getByText("Bài xem thử"));

    expect(await screen.findByText("Video giới thiệu")).toBeTruthy();
    expect(mockApi.get).toHaveBeenCalledWith(
      "/courses/khoa-demo/preview-lessons/11111111-1111-4111-8111-111111111111/contents"
    );
    // Không được đụng route cần đăng nhập.
    for (const call of mockApi.get.mock.calls) {
      expect(String(call[0])).not.toMatch(/^\/lessons\//);
    }
  });

  it("bài trả phí (chưa ghi danh): không gọi API, báo cần đăng ký khoá học", async () => {
    renderSyllabus(false);

    fireEvent.click(screen.getByText("Bài trả phí"));

    expect(await screen.findByText(/Đăng ký khóa học để xem nội dung/)).toBeTruthy();
    expect(mockApi.get).not.toHaveBeenCalled();
    expect(screen.queryByText(/Chưa có nội dung/)).toBeNull();
  });

  it("endpoint xem thử lỗi (404/mạng): báo không tải được, không nói 'Chưa có nội dung'", async () => {
    mockApi.get.mockRejectedValue(new Error("404"));
    renderSyllabus(false);

    fireEvent.click(screen.getByText("Bài xem thử"));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Không tải được"));
    expect(screen.queryByText(/Chưa có nội dung/)).toBeNull();
  });

  it("đã ghi danh: vẫn dùng route đầy đủ /lessons/:id/contents", async () => {
    mockApi.get.mockResolvedValue(envelope([]));
    renderSyllabus(true);

    fireEvent.click(screen.getByText("Bài trả phí"));

    await waitFor(() =>
      expect(mockApi.get).toHaveBeenCalledWith("/lessons/22222222-2222-4222-8222-222222222222/contents")
    );
  });
});
