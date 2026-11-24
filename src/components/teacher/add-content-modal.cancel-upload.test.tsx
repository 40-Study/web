/** Q4-T09: nút "Huỷ tải lên" cạnh thanh tiến độ — chỉ hiện khi đang upload, bấm thì gọi onCancelUpload. */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddContentModal } from "./add-content-modal";

async function openVideoWithFile(props: Partial<Parameters<typeof AddContentModal>[0]>) {
  const utils = render(
    <AddContentModal open onOpenChange={vi.fn()} onSubmit={vi.fn()} lessonId="lesson-1" onVideoFileSelect={vi.fn()} {...props} />,
  );
  await act(async () => {
    fireEvent.click(screen.getByText("Video bài giảng"));
  });
  const input = utils.container.ownerDocument.querySelector('input[type="file"][accept="video/*"]') as HTMLInputElement;
  await act(async () => {
    fireEvent.change(input, { target: { files: [new File(["v"], "bai-1.mp4", { type: "video/mp4" })] } });
  });
  return utils;
}

describe("AddContentModal — huỷ tải lên video (Q4-T09)", () => {
  it("đang upload: hiện nút 'Huỷ tải lên', bấm gọi onCancelUpload", async () => {
    const onCancelUpload = vi.fn();
    await openVideoWithFile({ isLoading: true, uploadProgress: 50, uploadStatus: "Đang upload phần 1/2...", onCancelUpload });
    fireEvent.click(screen.getByRole("button", { name: "Huỷ tải lên" }));
    expect(onCancelUpload).toHaveBeenCalledTimes(1);
  });

  it("không upload nữa (xong hoặc đã huỷ): không còn nút huỷ", async () => {
    await openVideoWithFile({ isLoading: false, uploadProgress: 100, uploadStatus: "Upload thành công!", onCancelUpload: vi.fn() });
    expect(screen.queryByRole("button", { name: "Huỷ tải lên" })).toBeNull();
  });
});
