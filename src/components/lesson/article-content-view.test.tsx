/**
 * QA 261008 T1/T7 — học viên đọc nội dung ARTICLE.
 *
 * `article_body` là HTML do giáo viên nhập (Tiptap) nên là đầu vào KHÔNG tin cậy: chỉ được render qua
 * `sanitizeHtml`. Test XSS ở đây là bài kiểm tra lỗi (failure-mode): nếu component render thẳng HTML thô
 * thì test phải ĐỎ.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArticleContentView } from "./article-content-view";

const updateProgress = vi.fn();
vi.mock("@/services/enrollment.service", () => ({
  enrollmentService: { updateProgress: (...args: unknown[]) => updateProgress(...args) },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderView(props: Partial<React.ComponentProps<typeof ArticleContentView>> = {}) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ArticleContentView
        lessonId="les-1"
        courseId="course-1"
        title="Giới thiệu Git"
        body="<p>Nội dung bài đọc</p>"
        completed={false}
        {...props}
      />
    </QueryClientProvider>
  );
}

describe("ArticleContentView", () => {
  beforeEach(() => {
    updateProgress.mockReset();
    delete (window as unknown as Record<string, unknown>).__pwn;
  });

  it("hiện tiêu đề, nội dung HTML và thời gian đọc do server tính", () => {
    renderView({ body: "<h2>Mục 1</h2><p>Nội dung bài đọc</p>", readingTimeMinutes: 3 });
    expect(screen.getByRole("heading", { level: 1, name: "Giới thiệu Git" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Mục 1" })).toBeTruthy();
    expect(screen.getByText("Nội dung bài đọc")).toBeTruthy();
    expect(screen.getByText(/3 phút đọc/)).toBeTruthy();
  });

  it("XSS: <script> và onerror= trong article_body bị loại bỏ, văn bản lành vẫn còn", () => {
    const { container } = renderView({
      body: '<p>An toàn</p><script>window.__pwn = 1</script><img src="x" onerror="window.__pwn = 2"><a href="javascript:window.__pwn=3">bấm</a>',
    });
    const html = container.innerHTML;
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/onerror/i);
    expect(html).not.toMatch(/javascript:/i);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
    expect((window as unknown as Record<string, unknown>).__pwn).toBeUndefined();
    expect(screen.getByText("An toàn")).toBeTruthy();
  });

  it("body rỗng -> thông báo tiếng Việt, không để trang trắng", () => {
    renderView({ body: "   " });
    expect(screen.getByText("Bài viết chưa có nội dung.")).toBeTruthy();
  });

  it("không có reading_time_minutes -> không hiện '0 phút đọc'", () => {
    renderView({ readingTimeMinutes: undefined });
    expect(screen.queryByText(/phút đọc/)).toBeNull();
  });

  it("'Đánh dấu đã đọc' gửi status=completed qua endpoint tiến độ của bài rồi hiện 'Đã hoàn thành'", async () => {
    updateProgress.mockResolvedValue({ lesson_id: "les-1", status: "completed" });
    renderView();
    fireEvent.click(screen.getByRole("button", { name: /Đánh dấu đã đọc/ }));
    await waitFor(() => expect(screen.getByText("Đã hoàn thành")).toBeTruthy());
    expect(updateProgress).toHaveBeenCalledWith("les-1", { status: "completed" });
  });

  it("bài đã hoàn thành: không hiện nút, không gọi API", () => {
    renderView({ completed: true });
    expect(screen.queryByRole("button", { name: /Đánh dấu đã đọc/ })).toBeNull();
    expect(screen.getByText("Đã hoàn thành")).toBeTruthy();
    expect(updateProgress).not.toHaveBeenCalled();
  });
});
