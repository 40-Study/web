/**
 * QA ce-main-261021 F7/#2: form "Thực hành Code" không có ô giới hạn thời gian / bộ nhớ / điểm đạt, nên mọi
 * bài code mang mặc định backend (2 s, 256 MB, 100%). Form giờ có ba ô này và gửi kèm `codeLimits`.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddContentModal } from "./add-content-modal";

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

async function openCodeForm(onSubmit = vi.fn().mockResolvedValue(true)) {
  render(<AddContentModal open onOpenChange={vi.fn()} onSubmit={onSubmit} lessonId="lesson-1" />);
  await click(screen.getByText("Bài tập"));
  await click(screen.getByText("Thực hành Code"));
  await type(screen.getByLabelText("Tiêu đề bài tập"), "Nhân đôi");
  await type(screen.getByPlaceholderText("Hãy viết function tính tổng các số chẵn..."), "In ra 2n");
  await type(screen.getByLabelText("Đầu vào test 1"), "3");
  await type(screen.getByLabelText("Đầu ra mong đợi test 1"), "6");
  return onSubmit;
}
const save = () => screen.getByRole("button", { name: /lưu bài tập/i });

describe("AddContentModal — bài thực hành code: giới hạn chấm", () => {
  it("mặc định khớp backend (2 giây, 256 MB, 100%) và được gửi kèm", async () => {
    const onSubmit = await openCodeForm();
    expect((screen.getByLabelText("Giới hạn thời gian (giây/test)") as HTMLInputElement).value).toBe("2");

    await click(save());

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      exerciseType: "code",
      codeLimits: { time_limit: 2, memory_limit: 256, pass_percentage: 100 },
      testCases: [expect.objectContaining({ input: "3", output: "6", hidden: false })],
    });
  });

  it("giảng viên đổi giới hạn -> gửi đúng giá trị đã nhập", async () => {
    const onSubmit = await openCodeForm();
    await type(screen.getByLabelText("Giới hạn thời gian (giây/test)"), "5");
    await type(screen.getByLabelText("Giới hạn bộ nhớ (MB)"), "128");
    await type(screen.getByLabelText("Điểm đạt (%)"), "70");

    await click(save());

    expect(onSubmit.mock.calls[0][0].codeLimits).toEqual({ time_limit: 5, memory_limit: 128, pass_percentage: 70 });
  });

  it("giới hạn không hợp lệ -> chặn gửi, báo lỗi dưới ô", async () => {
    const onSubmit = await openCodeForm();
    await type(screen.getByLabelText("Giới hạn bộ nhớ (MB)"), "0");

    await click(save());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Nhập số nguyên từ 16 đến 1024.")).toBeTruthy();
  });

  it("chỉ có test ẩn -> chặn gửi như trước (luật bộ test dùng chung)", async () => {
    const onSubmit = await openCodeForm();
    await click(screen.getByLabelText("Test ẩn 1"));

    await click(save());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId("add-content-submit-error").textContent).toContain("ít nhất một test mẫu công khai");
  });
});
