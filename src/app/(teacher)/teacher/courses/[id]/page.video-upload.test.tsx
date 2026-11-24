/**
 * Q4-T09 (review #125): nối dây upload video ở trang chi tiết khoá. PUT phần video chạy qua `putVideoChunk` thật
 * (XHR giả): lỗi mạng hiện câu tiếng Việt UPLOAD_UNREACHABLE_MESSAGE, nút "Huỷ tải lên" dừng PUT và gỡ phiên upload.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeXhr } from "@/test/fake-xhr";
import { UPLOAD_CANCELLED_MESSAGE, UPLOAD_UNREACHABLE_MESSAGE } from "@/lib/video-chunk-upload";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "course-1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

const OWNER_ID = "teacher-owner-uuid";
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { user?: { id: string }; activeRole?: string }) => unknown) =>
    selector({ user: { id: OWNER_ID }, activeRole: "TEACHER" }),
}));

vi.mock("@/hooks/queries/use-courses", () => ({
  useCourse: () => ({
    data: { id: "course-1", title: "Khoá test", instructor_id: OWNER_ID, status: "draft" },
    isLoading: false,
  }),
  useUpdateCourse: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/queries/use-course-approval", () => ({
  useSubmitCourseReview: () => ({ mutate: vi.fn(), isPending: false }),
  useWithdrawCourseReview: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/queries/use-sections", () => ({
  useSections: () => ({
    data: [{ id: "sec-1", title: "Chương 1", order: 1, lessons: [{ id: "les-1", title: "Bài 1", order: 1 }] }],
    isLoading: false,
  }),
  sectionKeys: { byCourse: (id: string) => ["sections", id] },
  useCreateSection: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReorderSections: () => ({ mutate: vi.fn() }),
  useDeleteSection: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/hooks/queries/use-lessons", () => ({
  useLessons: () => ({ data: [{ id: "les-1", title: "Bài 1", order: 1 }], isLoading: false }),
  useCreateLesson: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReorderLessons: () => ({ mutate: vi.fn() }),
  useDeleteLesson: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/hooks/queries/use-lesson-content", () => ({
  useLessonContents: () => ({ data: [], isLoading: false }),
  useCreateLessonContent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteLessonContent: () => ({ mutate: vi.fn() }),
  lessonContentKeys: { contents: (id: string) => ["lesson-content", "contents", id] },
}));

vi.mock("@/hooks/queries/use-live-sessions", () => ({
  useCreateLiveSession: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/queries/use-classes", () => ({
  useClasses: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));

const upload = vi.hoisted(() => ({
  initUpload: vi.fn(),
  getPresignedUrls: vi.fn(),
  chunkComplete: vi.fn(),
  completeUpload: vi.fn(),
  cancelUpload: vi.fn(),
}));
vi.mock("@/services/video-upload.service", () => ({ videoUploadService: upload }));

// Modal thật rất nặng; chỉ cần chọn file, bấm huỷ và xem dòng trạng thái.
vi.mock("@/components/teacher/add-content-modal", () => ({
  AddContentModal: ({
    open,
    onVideoFileSelect,
    onCancelUpload,
    uploadStatus,
  }: {
    open: boolean;
    onVideoFileSelect?: (f: File) => void;
    onCancelUpload?: () => void;
    uploadStatus?: string;
  }) =>
    open ? (
      <div>
        <button type="button" onClick={() => onVideoFileSelect?.(new File(["video"], "bai-1.mp4", { type: "video/mp4" }))}>
          chon-video
        </button>
        <button type="button" onClick={() => onCancelUpload?.()}>
          huy-upload
        </button>
        <p data-testid="upload-status">{uploadStatus}</p>
      </div>
    ) : null,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// eslint-disable-next-line import/first
import TeacherCourseDetailPage from "./page";

async function startUpload() {
  render(<TeacherCourseDetailPage />);
  fireEvent.click(screen.getByText("Bài 1"));
  fireEvent.click(screen.getByRole("button", { name: /Thêm nội dung/ }));
  fireEvent.click(screen.getByRole("button", { name: "chon-video" }));
  await waitFor(() => expect(FakeXhr.instances).toHaveLength(1));
  return FakeXhr.instances[0];
}

describe("/teacher/courses/[id] — upload video (Q4-T09)", () => {
  beforeEach(() => {
    FakeXhr.reset();
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
    upload.initUpload.mockReset().mockResolvedValue({ upload_id: "up-1" });
    upload.getPresignedUrls.mockReset().mockResolvedValue([{ chunk_number: 1, url: "http://172.18.0.4:9000/up-1/1" }]);
    upload.chunkComplete.mockReset().mockResolvedValue(undefined);
    upload.completeUpload.mockReset().mockResolvedValue(undefined);
    upload.cancelUpload.mockReset().mockResolvedValue(undefined);
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.info).mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("không kết nối được máy chủ lưu trữ: toast + dòng trạng thái tiếng Việt", async () => {
    const xhr = await startUpload();
    expect(xhr.url).toBe("http://172.18.0.4:9000/up-1/1");
    xhr.failNetwork();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(UPLOAD_UNREACHABLE_MESSAGE));
    expect(screen.getByTestId("upload-status").textContent).toBe(`Lỗi: ${UPLOAD_UNREACHABLE_MESSAGE}`);
    expect(upload.chunkComplete).not.toHaveBeenCalled();
  });

  it("bấm 'Huỷ tải lên': dừng PUT, gỡ phiên upload trên server, không báo lỗi", async () => {
    const xhr = await startUpload();
    fireEvent.click(screen.getByRole("button", { name: "huy-upload" }));

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith(UPLOAD_CANCELLED_MESSAGE));
    expect(xhr.aborted).toBe(true);
    expect(upload.cancelUpload).toHaveBeenCalledWith("up-1", "user_cancelled");
    expect(upload.chunkComplete).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(screen.getByTestId("upload-status").textContent).toBe(UPLOAD_CANCELLED_MESSAGE);
  });
});
