/**
 * Phase 0 review — finding #1: ô chọn lớp bắt buộc trong modal tạo buổi live.
 *
 * Kiểm phần UI: khoá 1 lớp thì modal tự chọn, khoá ≥2 lớp thì nút "Tạo buổi live"
 * bị vô hiệu hoá cho tới khi giáo viên chọn lớp.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Class } from "@/services/class.service";
import { AddContentModal } from "./add-content-modal";

function makeClass(id: string, name: string): Class {
  return { id, name } as Class;
}

const ONE_CLASS = [makeClass("class-a", "Lớp A")];
const TWO_CLASSES = [makeClass("class-a", "Lớp A"), makeClass("class-b", "Lớp B")];

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

/** Mở form livestream (bấm tile "Buổi học trực tiếp") rồi sang tab "Lịch trình". */
async function openLivestreamForm() {
  await act(async () => {
    fireEvent.click(screen.getByText("Buổi học trực tiếp"));
  });
  await act(async () => {
    fireEvent.click(screen.getByText("Lịch trình"));
  });
}

function getSubmitButton() {
  return screen.getByRole("button", { name: /tạo buổi live/i });
}

/** Nút gửi có bị chặn bởi thuộc tính `disabled` không (Base UI có thể chỉ set aria). */
function isSubmitDisabled(btn: HTMLElement) {
  return (
    (btn as HTMLButtonElement).disabled ||
    btn.getAttribute("aria-disabled") === "true" ||
    btn.getAttribute("data-disabled") !== null
  );
}

describe("AddContentModal — chọn lớp cho buổi live (finding #1)", () => {
  it("khoá 1 lớp: không hiện ô chọn lớp, nút gửi vẫn bật", async () => {
    renderModal({ courseClasses: ONE_CLASS });
    await openLivestreamForm();

    expect(screen.queryByText(/Lớp học/)).toBeNull();
    expect(isSubmitDisabled(getSubmitButton())).toBe(false);
  });

  it("khoá ≥2 lớp: hiện ô chọn lớp và CHẶN gửi khi chưa chọn", async () => {
    const onSubmit = vi.fn();
    renderModal({ courseClasses: TWO_CLASSES, onSubmit });
    await openLivestreamForm();

    // Ô chọn lớp có mặt, đánh dấu bắt buộc.
    expect(screen.getByText(/Lớp học/)).toBeTruthy();
    expect(screen.getByText("Chọn lớp cho buổi live")).toBeTruthy();

    const submit = getSubmitButton();
    expect(isSubmitDisabled(submit)).toBe(true);

    // Bấm dù đã bị vô hiệu hoá cũng không được gửi dữ liệu lên.
    await act(async () => {
      fireEvent.click(submit);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("khoá ≥2 lớp: sau khi chọn lớp thì gửi được kèm đúng class_id", async () => {
    const onSubmit = vi.fn();
    renderModal({ courseClasses: TWO_CLASSES, onSubmit });
    await openLivestreamForm();

    // Mở select và chọn "Lớp B".
    await act(async () => {
      fireEvent.click(screen.getByText("Chọn lớp cho buổi live"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Lớp B"));
    });

    expect(isSubmitDisabled(getSubmitButton())).toBe(false);

    await act(async () => {
      fireEvent.click(getSubmitButton());
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [submitted] = onSubmit.mock.calls[0] as [{ classId?: string | null; type: string }];
    expect(submitted.type).toBe("livestream");
    expect(submitted.classId).toBe("class-b");
  });

  it("khoá 0 lớp: nút gửi bị vô hiệu hoá (trang đã chặn bằng toast hướng dẫn trước đó)", async () => {
    renderModal({ courseClasses: [] });
    await openLivestreamForm();

    expect(isSubmitDisabled(getSubmitButton())).toBe(true);
  });

  it("không còn thu các field backend không nhận (duration / platform / enableReminder)", async () => {
    renderModal({ courseClasses: ONE_CLASS });
    await openLivestreamForm();

    // Tab "Lịch phát sóng" đang mở mặc định — các nhãn cũ phải biến mất.
    expect(screen.queryByText("Thời lượng")).toBeNull();
    expect(screen.queryByText("Nền tảng")).toBeNull();
    expect(screen.queryByText("Thông báo nhắc nhở")).toBeNull();
    // Field backend CÓ nhận thì vẫn giữ.
    expect(screen.getByText("Tự động ghi lại")).toBeTruthy();
  });
});
