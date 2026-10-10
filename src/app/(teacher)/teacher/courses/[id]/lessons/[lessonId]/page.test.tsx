/**
 * QA 261008 T8/T9 — trang chi tiết bài học của giáo viên:
 *  - T8: "Vị trí:" để trống vì đọc `lesson.position` (API chỉ trả `display_order`).
 *  - T9: huy hiệu loại luôn là "ARTICLE" vì đọc `lesson.type` (không còn; loại nằm trên LessonContent).
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "course-1", lessonId: "les-1" }),
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

vi.mock("@/hooks/queries/use-sections", () => ({
  useSections: () => ({ data: [{ id: "sec-1", title: "Chương 1", order: 1 }], isLoading: false }),
}));

// Đúng hình dạng API: có display_order, KHÔNG có position/type.
vi.mock("@/hooks/queries/use-lessons", () => ({
  useLessons: (_courseId: string, sectionId: string) => ({
    data: sectionId
      ? [{ id: "les-1", section_id: "sec-1", title: "Bài 1", display_order: 3, is_preview: false }]
      : undefined,
    isLoading: false,
  }),
  useUpdateLesson: () => ({ mutate: vi.fn() }),
}));

interface MockContent {
  id: string;
  type: string;
  title?: string;
  article_body?: string;
  updated_at?: string;
}
let mockContents: MockContent[] = [];
const mockCreateContent = vi.fn();
const mockUpdateContent = vi.fn();
vi.mock("@/hooks/queries/use-lesson-content", () => ({
  useLessonContents: () => ({ data: mockContents, isLoading: false }),
  useCreateLessonContent: () => ({ mutateAsync: (...a: unknown[]) => mockCreateContent(...a) }),
  useUpdateLessonContent: () => ({ mutateAsync: (...a: unknown[]) => mockUpdateContent(...a) }),
}));

// Tiptap thật cần DOM/ProseMirror đầy đủ; test chỉ cần một ô nhập phát `onChange(html)`.
vi.mock("@/components/editor/tiptap-editor", () => ({
  TiptapEditor: ({ value, onChange }: { value?: string; onChange?: (html: string) => void }) => (
    <textarea aria-label="Nội dung bài viết" value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} />
  ),
}));

vi.mock("@/components/teacher/subtitle-upload-field", () => ({ SubtitleUploadField: () => null }));

// eslint-disable-next-line import/first
import TeacherLessonDetailPage from "./page";

describe("/teacher/courses/[id]/lessons/[lessonId] (T8/T9)", () => {
  beforeEach(() => {
    mockContents = [];
    mockCreateContent.mockReset().mockResolvedValue({ id: "new" });
    mockUpdateContent.mockReset().mockResolvedValue({ id: "c-art" });
  });

  it("T8: 'Vị trí:' hiện display_order của bài (không để trống)", () => {
    render(<TeacherLessonDetailPage />);
    const row = screen.getByText("Vị trí:").parentElement as HTMLElement;
    expect(row.textContent).toBe("Vị trí: 3");
  });

  it("T9: bài chưa có nội dung -> không bịa huy hiệu 'ARTICLE'", () => {
    render(<TeacherLessonDetailPage />);
    expect(screen.queryByText("ARTICLE")).toBeNull();
  });

  it("T9: huy hiệu lấy từ loại nội dung thật của bài, mỗi loại một lần", () => {
    mockContents = [
      { id: "c1", type: "video" },
      { id: "c2", type: "video" },
      { id: "c3", type: "exercise" },
    ];
    render(<TeacherLessonDetailPage />);
    expect(screen.getAllByText("VIDEO")).toHaveLength(1);
    expect(screen.getByText("BÀI TẬP")).toBeTruthy();
    expect(screen.queryByText("ARTICLE")).toBeNull();
  });
});

// QA 261008 T1 — trang bài học từng không có chỗ nào để soạn nội dung bài viết.
describe("/teacher/courses/[id]/lessons/[lessonId] — soạn bài viết (T1)", () => {
  beforeEach(() => {
    mockContents = [];
    mockCreateContent.mockReset().mockResolvedValue({ id: "new" });
    mockUpdateContent.mockReset().mockResolvedValue({ id: "c-art" });
  });

  const typeInto = async (el: HTMLElement, value: string) => {
    await act(async () => {
      fireEvent.change(el, { target: { value } });
    });
  };

  it("huy hiệu có nhãn cho bài viết và trắc nghiệm (không rơi về chữ thô 'ARTICLE'/'QUIZ')", () => {
    mockContents = [
      { id: "c1", type: "article", title: "Bài đọc", article_body: "<p>x</p>" },
      { id: "c2", type: "quiz" },
    ];
    render(<TeacherLessonDetailPage />);
    expect(screen.getByText("BÀI VIẾT")).toBeTruthy();
    expect(screen.getByText("TRẮC NGHIỆM")).toBeTruthy();
    expect(screen.queryByText("ARTICLE")).toBeNull();
    expect(screen.queryByText("QUIZ")).toBeNull();
  });

  it("bài trống: có form soạn bài viết, lưu gửi POST type 'article' kèm article_body", async () => {
    render(<TeacherLessonDetailPage />);
    expect(screen.getByRole("heading", { name: "Nội dung bài viết" })).toBeTruthy();

    // Tiêu đề điền sẵn bằng tên bài; nút lưu bị khoá tới khi có nội dung.
    expect((screen.getByLabelText("Tiêu đề bài viết") as HTMLInputElement).value).toBe("Bài 1");
    expect((screen.getByRole("button", { name: "Tạo bài viết" }) as HTMLButtonElement).disabled).toBe(true);

    await typeInto(screen.getByLabelText("Nội dung bài viết"), "<p>Nội dung mới</p>");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Tạo bài viết" }));
    });

    expect(mockCreateContent).toHaveBeenCalledWith({
      type: "article",
      title: "Bài 1",
      article_body: "<p>Nội dung mới</p>",
      is_mandatory: true,
    });
  });

  it("bài đã có bài viết: nạp sẵn tiêu đề + nội dung, lưu gửi PUT (không gửi type)", async () => {
    mockContents = [{ id: "c-art", type: "article", title: "Bài đọc cũ", article_body: "<p>Bản cũ</p>" }];
    render(<TeacherLessonDetailPage />);

    expect((screen.getByLabelText("Tiêu đề bài viết") as HTMLInputElement).value).toBe("Bài đọc cũ");
    expect((screen.getByLabelText("Nội dung bài viết") as HTMLTextAreaElement).value).toBe("<p>Bản cũ</p>");

    await typeInto(screen.getByLabelText("Nội dung bài viết"), "<p>Bản mới</p>");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    });

    expect(mockUpdateContent).toHaveBeenCalledWith({
      contentId: "c-art",
      data: { title: "Bài đọc cũ", article_body: "<p>Bản mới</p>" },
    });
    expect(mockCreateContent).not.toHaveBeenCalled();
  });

  it("backend từ chối khi sửa -> lý do hiện dưới form, nội dung đã viết còn nguyên", async () => {
    mockContents = [{ id: "c-art", type: "article", title: "Bài đọc", article_body: "<p>Bản cũ</p>" }];
    mockUpdateContent.mockRejectedValue(new Error("Nội dung bài viết quá dài"));
    render(<TeacherLessonDetailPage />);

    await typeInto(screen.getByLabelText("Nội dung bài viết"), "<p>Rất dài</p>");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    });

    await waitFor(() => expect(screen.getByTestId("article-submit-error")).toBeTruthy());
    expect((screen.getByLabelText("Nội dung bài viết") as HTMLTextAreaElement).value).toBe("<p>Rất dài</p>");
  });

  it("bài có nội dung khác (video) mà chưa có bài viết: không bày form trống, chỉ có nút 'Thêm bài viết'", () => {
    mockContents = [{ id: "c-vid", type: "video" }];
    render(<TeacherLessonDetailPage />);
    expect(screen.queryByLabelText("Tiêu đề bài viết")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thêm bài viết" }));
    expect(screen.getByLabelText("Tiêu đề bài viết")).toBeTruthy();
  });
});
