/**
 * QA 261008 T4 + T3 — modal "Thêm nội dung bài học":
 *  - T4: bấm lưu với tiêu đề trống từng đóng modal và xoá hết dữ liệu (chỉ còn toast chung). Giờ phải
 *    chặn tại chỗ, đánh dấu ô tiêu đề và GIỮ modal mở; lỗi từ backend cũng không được xoá form.
 *  - T3: câu trắc nghiệm không có đáp án đúng phải bị chặn, chỉ ra đúng câu.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddContentModal, type ContentSubmitResult } from "./add-content-modal";

// Tiptap thật cần DOM/ProseMirror đầy đủ; test chỉ cần một ô nhập phát `onChange(html)`.
vi.mock("@/components/editor/tiptap-editor", () => ({
  TiptapEditor: ({ value, onChange }: { value?: string; onChange?: (html: string) => void }) => (
    <textarea aria-label="Nội dung bài viết" value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} />
  ),
}));

function renderModal(onSubmit: (d: unknown) => ContentSubmitResult | Promise<ContentSubmitResult>) {
  const onOpenChange = vi.fn();
  render(
    <AddContentModal
      open
      onOpenChange={onOpenChange}
      onSubmit={onSubmit as never}
      lessonId="lesson-1"
    />
  );
  return { onOpenChange };
}

async function click(el: HTMLElement) {
  await act(async () => {
    fireEvent.click(el);
  });
}

async function type(el: HTMLElement, value: string) {
  await act(async () => {
    fireEvent.change(el, { target: { value } });
  });
}

async function openVideoForm() {
  await click(screen.getByText("Video bài giảng"));
}

const saveVideo = () => screen.getByRole("button", { name: /thêm video/i });

describe("AddContentModal — tiêu đề bắt buộc (T4)", () => {
  it("tiêu đề trống: KHÔNG gửi, KHÔNG đóng, ô tiêu đề báo lỗi và dữ liệu đã gõ còn nguyên", async () => {
    const onSubmit = vi.fn();
    const { onOpenChange } = renderModal(onSubmit);
    await openVideoForm();
    await type(screen.getByPlaceholderText("https://..."), "https://youtu.be/abc");

    await click(saveVideo());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    const titleInput = screen.getByLabelText("Tiêu đề video");
    expect(titleInput.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getAllByText("Vui lòng nhập tiêu đề.").length).toBeGreaterThan(0);
    expect((screen.getByPlaceholderText("https://...") as HTMLInputElement).value).toBe("https://youtu.be/abc");
  });

  it("lỗi tiêu đề biến mất ngay khi giáo viên gõ tiêu đề", async () => {
    renderModal(vi.fn());
    await openVideoForm();
    await click(saveVideo());
    expect(screen.getByLabelText("Tiêu đề video").getAttribute("aria-invalid")).toBe("true");

    await type(screen.getByLabelText("Tiêu đề video"), "Bài 1");

    expect(screen.getByLabelText("Tiêu đề video").getAttribute("aria-invalid")).toBeNull();
  });

  it("tiêu đề chỉ có khoảng trắng cũng bị chặn", async () => {
    const onSubmit = vi.fn();
    renderModal(onSubmit);
    await openVideoForm();
    await type(screen.getByLabelText("Tiêu đề video"), "   ");
    await click(saveVideo());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("parent trả false (API lỗi): modal giữ nguyên dữ liệu, không đóng", async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    const { onOpenChange } = renderModal(onSubmit);
    await openVideoForm();
    await type(screen.getByLabelText("Tiêu đề video"), "Bài 1");

    await click(saveVideo());

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Tiêu đề video") as HTMLInputElement).value).toBe("Bài 1");
  });

  it("parent trả { error }: hiện đúng lý do backend trong modal, giữ dữ liệu, cho gửi lại", async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValueOnce({ error: "Vui lòng nhập tiêu đề" })
      .mockResolvedValueOnce(undefined);
    const { onOpenChange } = renderModal(onSubmit);
    await openVideoForm();
    await type(screen.getByLabelText("Tiêu đề video"), "Bài 1");

    await click(saveVideo());
    expect(screen.getByTestId("add-content-submit-error").textContent).toBe("Vui lòng nhập tiêu đề");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Tiêu đề video") as HTMLInputElement).value).toBe("Bài 1");

    await click(saveVideo());
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByTestId("add-content-submit-error")).toBeNull();
  });

  it("onSubmit ném lỗi: không đóng, hiện lỗi (không bao giờ nuốt im lặng)", async () => {
    const { onOpenChange } = renderModal(vi.fn().mockRejectedValue(new Error("boom")));
    await openVideoForm();
    await type(screen.getByLabelText("Tiêu đề video"), "Bài 1");

    await click(saveVideo());

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("add-content-submit-error")).toBeTruthy();
  });

  it("thành công (trả true/void): đóng modal", async () => {
    const { onOpenChange } = renderModal(vi.fn().mockResolvedValue(true));
    await openVideoForm();
    await type(screen.getByLabelText("Tiêu đề video"), "Bài 1");

    await click(saveVideo());

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("AddContentModal — câu trắc nghiệm phải có đáp án đúng (T3)", () => {
  async function openQuizExercise() {
    await click(screen.getByText("Bài tập"));
    await click(screen.getByText("Trắc nghiệm"));
    await type(screen.getByLabelText("Tiêu đề bài kiểm tra"), "Kiểm tra Go");
  }
  const saveExercise = () => screen.getByRole("button", { name: /lưu bài tập/i });

  it("chưa chọn đáp án đúng: chặn gửi, báo lỗi ngay dưới câu hỏi, modal mở", async () => {
    const onSubmit = vi.fn();
    const { onOpenChange } = renderModal(onSubmit);
    await openQuizExercise();
    await type(screen.getByPlaceholderText("Nhập câu hỏi..."), "1 + 1 = ?");

    await click(saveExercise());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("quiz-question-0").textContent).toContain("Chọn đáp án đúng cho câu hỏi này.");
    expect((screen.getByPlaceholderText("Nhập câu hỏi...") as HTMLInputElement).value).toBe("1 + 1 = ?");
  });

  it("chọn đáp án đúng xong thì gửi được và lỗi biến mất", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    renderModal(onSubmit);
    await openQuizExercise();
    await click(saveExercise());
    expect(onSubmit).not.toHaveBeenCalled();

    await click(screen.getAllByRole("button", { name: /đáp án đúng của câu 1/i })[2]);
    expect(screen.queryByText("Chọn đáp án đúng cho câu hỏi này.")).toBeNull();

    await click(saveExercise());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [data] = onSubmit.mock.calls[0] as [{ quizQuestions: { correctId: string; options: { id: string }[] }[] }];
    expect(data.quizQuestions[0].correctId).toBe(data.quizQuestions[0].options[2].id);
  });

  it("quiz kèm video (tab Quiz): câu thiếu đáp án đúng chặn gửi và đưa giáo viên tới tab Quiz", async () => {
    const onSubmit = vi.fn();
    renderModal(onSubmit);
    await openVideoForm();
    await type(screen.getByLabelText("Tiêu đề video"), "Bài 1");
    await click(screen.getByRole("tab", { name: "Quiz" }));
    await click(screen.getByRole("button", { name: /thêm câu hỏi/i }));
    // quay lại tab nội dung rồi bấm lưu: lỗi nằm ở tab đang ẩn
    await click(screen.getByRole("tab", { name: "Nội dung" }));

    await click(saveVideo());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId("add-content-validation-error").textContent).toContain("chưa chọn đáp án đúng");
    expect(screen.getByTestId("quiz-question-0")).toBeTruthy(); // đã chuyển sang tab Quiz
  });
});


// QA 261008 T1/T7 — loại nội dung "Bài viết".
describe("AddContentModal — bài viết (T1/T7)", () => {
  async function openArticleForm() {
    await click(screen.getByText("Bài viết"));
  }
  const saveArticle = () => screen.getByRole("button", { name: "Lưu bài viết" });
  const body = () => screen.getByLabelText("Nội dung bài viết");

  it("bước chọn loại có thêm 'Bài viết' bên cạnh video, buổi live và bài tập", () => {
    renderModal(vi.fn());
    for (const label of ["Video bài giảng", "Buổi học trực tiếp", "Bài tập", "Bài viết"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("nội dung trống (Tiptap phát <p></p>) -> nút lưu bị vô hiệu hoá, không gửi", async () => {
    const onSubmit = vi.fn();
    renderModal(onSubmit);
    await openArticleForm();
    await type(screen.getByLabelText("Tiêu đề bài viết"), "Bài đọc");
    await type(body(), "<p></p>");

    expect((saveArticle() as HTMLButtonElement).disabled).toBe(true);
    await click(saveArticle());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("tiêu đề trống: KHÔNG gửi, báo lỗi ở ô tiêu đề, giữ nguyên nội dung đã viết", async () => {
    const onSubmit = vi.fn();
    const { onOpenChange } = renderModal(onSubmit);
    await openArticleForm();
    await type(body(), "<p>Đã viết khá dài</p>");

    await click(saveArticle());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByText("Vui lòng nhập tiêu đề.")).toBeTruthy();
    expect((body() as HTMLTextAreaElement).value).toBe("<p>Đã viết khá dài</p>");
  });

  it("hợp lệ -> gửi { type: 'article', title, articleBody } rồi đóng modal", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const { onOpenChange } = renderModal(onSubmit);
    await openArticleForm();
    await type(screen.getByLabelText("Tiêu đề bài viết"), "  Bài đọc 1  ");
    await type(body(), "<p>Nội dung</p>");

    await click(saveArticle());

    expect(onSubmit).toHaveBeenCalledWith({ type: "article", title: "Bài đọc 1", articleBody: "<p>Nội dung</p>" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("backend từ chối ({ error }) -> modal GIỮ MỞ, hiện lý do và còn nguyên tiêu đề + nội dung", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ error: "Nội dung bài viết quá dài" });
    const { onOpenChange } = renderModal(onSubmit);
    await openArticleForm();
    await type(screen.getByLabelText("Tiêu đề bài viết"), "Bài đọc 1");
    await type(body(), "<p>Nội dung dài</p>");

    await click(saveArticle());

    expect(screen.getByTestId("article-submit-error").textContent).toBe("Nội dung bài viết quá dài");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect((screen.getByLabelText("Tiêu đề bài viết") as HTMLInputElement).value).toBe("Bài đọc 1");
    expect((body() as HTMLTextAreaElement).value).toBe("<p>Nội dung dài</p>");
  });
});
