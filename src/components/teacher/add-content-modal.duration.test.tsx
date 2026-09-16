/**
 * C-6 — modal thêm video bài giảng: thời lượng video.
 *
 * Chốt ba điều mà lỗi ở đây sẽ rất khó thấy:
 * 1. ô trống → payload KHÔNG có khoá `duration` (không phải `duration: 0`)
 * 2. giáo viên nhập `phút:giây` → gửi đi bằng GIÂY
 * 3. chỉ nội dung `video` mới có trường này
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddContentModal } from "./add-content-modal";

function renderModal(props: Partial<Parameters<typeof AddContentModal>[0]> = {}) {
  return render(
    <AddContentModal
      open
      onOpenChange={vi.fn()}
      onSubmit={vi.fn()}
      lessonId="lesson-1"
      {...props}
    />
  );
}

/** Mở form video (bấm tile "Video bài giảng"). */
async function openVideoForm() {
  await act(async () => {
    fireEvent.click(screen.getByText("Video bài giảng"));
  });
}

function getSubmitButton() {
  return screen.getByRole("button", { name: /thêm video/i });
}

function isSubmitDisabled(btn: HTMLElement) {
  return (
    (btn as HTMLButtonElement).disabled ||
    btn.getAttribute("aria-disabled") === "true" ||
    btn.getAttribute("data-disabled") !== null
  );
}

async function fillTitleAndUrl() {
  await act(async () => {
    fireEvent.change(screen.getByPlaceholderText("VD: Bài 1 - Giới thiệu Go"), {
      target: { value: "Bài 1" },
    });
  });
  await act(async () => {
    fireEvent.change(screen.getByPlaceholderText("https://..."), {
      target: { value: "https://www.youtube.com/watch?v=abc" },
    });
  });
}

function getDurationInput() {
  return screen.getByPlaceholderText("VD: 12:30");
}

describe("AddContentModal — thời lượng video (C-6)", () => {
  it("ô trống: payload KHÔNG có khoá `duration` (không gửi 0)", async () => {
    const onSubmit = vi.fn();
    renderModal({ onSubmit });
    await openVideoForm();
    await fillTitleAndUrl();

    await act(async () => {
      fireEvent.click(getSubmitButton());
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [submitted] = onSubmit.mock.calls[0] as [VideoContentDataLike];
    // Điểm mấu chốt của C-6: khoá phải VẮNG MẶT. `duration: 0` bị backend đọc là
    // "chưa biết" nên nó vô hiệu hoá luôn tính năng này.
    expect("duration" in submitted).toBe(false);
    expect(submitted.duration).toBeUndefined();
  });

  it("nhập `12:30` gửi đi 750 GIÂY", async () => {
    const onSubmit = vi.fn();
    renderModal({ onSubmit });
    await openVideoForm();
    await fillTitleAndUrl();

    await act(async () => {
      fireEvent.change(getDurationInput(), { target: { value: "12:30" } });
    });
    await act(async () => {
      fireEvent.click(getSubmitButton());
    });

    const [submitted] = onSubmit.mock.calls[0] as [VideoContentDataLike];
    expect(submitted.duration).toBe(750);
  });

  it("số trần hiểu là phút: `12` gửi đi 720 giây", async () => {
    const onSubmit = vi.fn();
    renderModal({ onSubmit });
    await openVideoForm();
    await fillTitleAndUrl();

    await act(async () => {
      fireEvent.change(getDurationInput(), { target: { value: "12" } });
    });
    await act(async () => {
      fireEvent.click(getSubmitButton());
    });

    const [submitted] = onSubmit.mock.calls[0] as [VideoContentDataLike];
    expect(submitted.duration).toBe(720);
  });

  it("`0` không phải ô trống: bị chặn gửi kèm lý do, không âm thầm gửi 0", async () => {
    const onSubmit = vi.fn();
    renderModal({ onSubmit });
    await openVideoForm();
    await fillTitleAndUrl();

    await act(async () => {
      fireEvent.change(getDurationInput(), { target: { value: "0" } });
    });

    const submitBtn = getSubmitButton();
    expect(isSubmitDisabled(submitBtn)).toBe(true);

    await act(async () => {
      fireEvent.click(submitBtn);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("loại bỏ giá trị sai rồi nhập lại được", async () => {
    const onSubmit = vi.fn();
    renderModal({ onSubmit });
    await openVideoForm();
    await fillTitleAndUrl();

    await act(async () => {
      fireEvent.change(getDurationInput(), { target: { value: "abc" } });
    });
    expect(isSubmitDisabled(getSubmitButton())).toBe(true);

    await act(async () => {
      fireEvent.change(getDurationInput(), { target: { value: "5:00" } });
    });
    expect(isSubmitDisabled(getSubmitButton())).toBe(false);

    await act(async () => {
      fireEvent.click(getSubmitButton());
    });
    const [submitted] = onSubmit.mock.calls[0] as [VideoContentDataLike];
    expect(submitted.duration).toBe(300);
  });

  it("video ngoài hệ thống: gợi ý nói rõ phải nhập thời lượng", async () => {
    renderModal();
    await openVideoForm();
    await fillTitleAndUrl();

    expect(
      screen.getByText(/Bỏ trống thì học viên không bao giờ hoàn thành được bài này/)
    ).toBeTruthy();
  });

  it("video đã upload: gợi ý nói hệ thống tự đọc, không doạ giáo viên", async () => {
    renderModal({ uploadedVideoUrl: "/api/hls/up-123/master.m3u8" });
    await openVideoForm();

    expect(screen.getByText(/hệ thống tự đọc được thời lượng/)).toBeTruthy();
  });

  it("buổi live không có ô thời lượng và không gửi trường `duration`", async () => {
    const onSubmit = vi.fn();
    renderModal({
      onSubmit,
      courseClasses: [{ id: "class-a", name: "Lớp A" } as never],
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Buổi học trực tiếp"));
    });
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("VD: Q&A - Giải đáp thắc mắc"), {
        target: { value: "Buổi 1" },
      });
    });

    expect(screen.queryByPlaceholderText("VD: 12:30")).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /tạo buổi live/i }));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [submitted] = onSubmit.mock.calls[0] as [Record<string, unknown>];
    expect(submitted.type).toBe("livestream");
    expect("duration" in submitted).toBe(false);
  });

  it("mở lại modal sau khi gửi: ô thời lượng đã được xoá trắng", async () => {
    const onSubmit = vi.fn();
    renderModal({ onSubmit });
    await openVideoForm();
    await fillTitleAndUrl();

    await act(async () => {
      fireEvent.change(getDurationInput(), { target: { value: "9:00" } });
    });
    await act(async () => {
      fireEvent.click(getSubmitButton());
    });

    // `handleClose` gọi `resetAll` → mở lại form phải là ô trống, không dính 9:00
    await act(async () => {
      fireEvent.click(screen.getByText("Video bài giảng"));
    });
    expect((getDurationInput() as HTMLInputElement).value).toBe("");
  });
});

/** Payload thật là union; test chỉ soi nhánh video nên khai báo tối thiểu ở đây. */
interface VideoContentDataLike {
  duration?: number;
  type?: string;
}
