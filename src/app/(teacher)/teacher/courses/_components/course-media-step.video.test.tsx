/**
 * QA3 Q3-10: video giới thiệu gửi resource_id "course_preview" (không phải UUID) -> backend 400 "Invalid request
 * body" hiện nguyên văn tiếng Anh. Chỉ cho tải lên khi khoá đã tồn tại (gửi UUID của khoá) và dịch lỗi sang tiếng Việt.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors";
import { initialCourseFormData } from "./course-form-model";

const upload = vi.fn();
let mockError: Error | null = null;
vi.mock("@/hooks/use-video-upload", () => ({
  useVideoUpload: () => ({ upload, progress: 0, isUploading: false, uploadId: null, error: mockError, reset: vi.fn() }),
}));
vi.mock("@/lib/api-client", () => ({ api: { post: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// eslint-disable-next-line import/first
import { CourseMediaStep, PREVIEW_VIDEO_NEEDS_COURSE_NOTE, PREVIEW_VIDEO_UPLOAD_ERROR } from "./course-media-step";

const videoFile = () => new File(["x"], "intro.mp4", { type: "video/mp4" });
const videoInput = (container: HTMLElement) => container.querySelector('input[accept="video/*"]') as HTMLInputElement;

describe("CourseMediaStep — video giới thiệu (Q3-10)", () => {
  beforeEach(() => {
    upload.mockReset().mockResolvedValue("upload-1");
    mockError = null;
  });

  it("chưa có khoá (trang tạo): nút tải video bị khoá kèm ghi chú 'Lưu khoá học trước...'", () => {
    render(<CourseMediaStep formData={initialCourseFormData} update={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /Tải video lên/ }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(PREVIEW_VIDEO_NEEDS_COURSE_NOTE).toBe("Lưu khoá học trước, sau đó tải video giới thiệu");
    expect(btn.textContent).toContain(PREVIEW_VIDEO_NEEDS_COURSE_NOTE);
  });

  it("chưa có khoá: chọn tệp bằng cách khác cũng KHÔNG gọi upload", () => {
    const { container } = render(<CourseMediaStep formData={initialCourseFormData} update={vi.fn()} />);
    fireEvent.change(videoInput(container), { target: { files: [videoFile()] } });
    expect(upload).not.toHaveBeenCalled();
  });

  it("đã có khoá (trang sửa): tải lên với resource_id là UUID của khoá, không phải 'course_preview'", async () => {
    const update = vi.fn();
    const { container } = render(<CourseMediaStep formData={initialCourseFormData} update={update} courseId="11111111-2222-3333-4444-555555555555" />);
    expect((screen.getByRole("button", { name: /Tải video lên/ }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.change(videoInput(container), { target: { files: [videoFile()] } });

    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    expect(upload.mock.calls[0][1]).toBe("11111111-2222-3333-4444-555555555555");
    await waitFor(() => expect(update).toHaveBeenCalledWith("preview_video_url", "/videos/upload-1"));
  });

  it("lỗi 400 tiếng Anh của backend được dịch sang câu tiếng Việt", () => {
    mockError = new ValidationError({}, { code: "", message: "Invalid request body", payload: {} });
    render(
      <CourseMediaStep
        formData={{ ...initialCourseFormData, preview_video_file: videoFile() }}
        update={vi.fn()}
        courseId="c1"
      />
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe(PREVIEW_VIDEO_UPLOAD_ERROR);
    expect(alert.textContent).not.toMatch(/Invalid request body/);
  });
});
