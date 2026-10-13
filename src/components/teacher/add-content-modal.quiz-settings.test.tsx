/**
 * QA2 Q2-04 + Q2-09 — form trắc nghiệm trong modal "Thêm nội dung":
 *  - Q2-04: chỉ có tiêu đề và thời gian; điểm đạt / số lần làm bị ghi cứng 70 / 3 ở nơi lưu. Giờ có hai ô nhập,
 *    kiểm tra hợp lệ, và giá trị đi theo dữ liệu gửi lên.
 *  - Q2-09: nút lưu ghi "Lưu bài tập" (từ ngữ của bài tập) cho một bài trắc nghiệm.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddContentModal } from "./add-content-modal";

vi.mock("@/components/editor/tiptap-editor", () => ({
  TiptapEditor: () => <textarea aria-label="Nội dung bài viết" />,
}));

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

async function openQuizForm(onSubmit = vi.fn().mockResolvedValue(true)) {
  render(<AddContentModal open onOpenChange={vi.fn()} onSubmit={onSubmit as never} lessonId="lesson-1" />);
  await click(screen.getByText("Bài tập"));
  await click(screen.getByText("Trắc nghiệm"));
  await type(screen.getByLabelText("Tiêu đề bài kiểm tra"), "Kiểm tra Go");
  await type(screen.getByPlaceholderText("Nhập câu hỏi..."), "1 + 1 = ?");
  await click(screen.getAllByRole("button", { name: /đáp án đúng của câu 1/i })[0]);
  return onSubmit;
}

type Submitted = { passPercentage?: number; maxAttempts?: number };

describe("AddContentModal — cài đặt chấm điểm trắc nghiệm (Q2-04)", () => {
  it("hiện hai ô với mặc định 70% và 3 lần", async () => {
    await openQuizForm();
    expect((screen.getByLabelText("Điểm đạt (%)") as HTMLInputElement).value).toBe("70");
    expect((screen.getByLabelText("Số lần làm tối đa") as HTMLInputElement).value).toBe("3");
  });

  it("giá trị giảng viên nhập đi theo dữ liệu gửi lên (không còn ghi cứng)", async () => {
    const onSubmit = await openQuizForm();
    await type(screen.getByLabelText("Điểm đạt (%)"), "85");
    await type(screen.getByLabelText("Số lần làm tối đa"), "5");

    await click(screen.getByRole("button", { name: "Lưu bài trắc nghiệm" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [data] = onSubmit.mock.calls[0] as [Submitted];
    expect(data.passPercentage).toBe(85);
    expect(data.maxAttempts).toBe(5);
  });

  it("để mặc định thì gửi đúng 70 và 3 như trước", async () => {
    const onSubmit = await openQuizForm();
    await click(screen.getByRole("button", { name: "Lưu bài trắc nghiệm" }));
    const [data] = onSubmit.mock.calls[0] as [Submitted];
    expect(data.passPercentage).toBe(70);
    expect(data.maxAttempts).toBe(3);
  });

  it.each([
    ["Điểm đạt (%)", "150", /Điểm đạt phải là số từ 1 đến 100/],
    ["Điểm đạt (%)", "", /Điểm đạt phải là số từ 1 đến 100/],
    ["Số lần làm tối đa", "0", /Số lần làm tối đa phải là số nguyên/],
    ["Số lần làm tối đa", "", /Số lần làm tối đa phải là số nguyên/],
  ])("%s = %j: chặn gửi và báo lỗi tại ô", async (label, value, message) => {
    const onSubmit = await openQuizForm();
    await type(screen.getByLabelText(label), value);

    await click(screen.getByRole("button", { name: "Lưu bài trắc nghiệm" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(message)).toBeTruthy();
  });
});

describe("AddContentModal — nhãn nút lưu (Q2-09)", () => {
  it("trắc nghiệm: 'Lưu bài trắc nghiệm', không còn 'Lưu bài tập'", async () => {
    await openQuizForm();
    expect(screen.getByRole("button", { name: "Lưu bài trắc nghiệm" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Lưu bài tập" })).toBeNull();
  });

  it("bài tập code vẫn là 'Lưu bài tập'", async () => {
    render(<AddContentModal open onOpenChange={vi.fn()} onSubmit={vi.fn() as never} lessonId="lesson-1" />);
    await click(screen.getByText("Bài tập"));
    await click(screen.getByText("Thực hành Code"));
    expect(screen.getByRole("button", { name: "Lưu bài tập" })).toBeTruthy();
  });
});
