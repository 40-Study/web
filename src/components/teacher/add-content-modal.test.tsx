/**
 * C-004 regression — add-content-modal.tsx upload URL correctness
 *
 * Proves: handleSubmit (useCallback) uses the latest uploadedVideoUrl prop
 * value when the callback is called, not a stale closure from before the
 * upload completed.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddContentModal } from "./add-content-modal";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderModal(props: Partial<Parameters<typeof AddContentModal>[0]> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    onSubmit: vi.fn(),
    lessonId: "lesson-1",
    ...props,
  };
  return render(<AddContentModal {...defaults} />);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("AddContentModal — upload URL hook correctness (C-004)", () => {
  it("handleSubmit uses the uploadedVideoUrl that arrived after initial render", async () => {
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    const { rerender } = renderModal({ onSubmit, onOpenChange, uploadedVideoUrl: undefined });

    // Navigate to video form
    const videoTile = screen.getByText("Video bài giảng");
    await act(async () => {
      fireEvent.click(videoTile);
    });

    // Simulate upload completing: parent passes new uploadedVideoUrl prop
    rerender(
      <AddContentModal
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        lessonId="lesson-1"
        uploadedVideoUrl="https://cdn.example.com/video-123.mp4"
      />
    );

    // Submit the form ("Thêm video" button)
    const submitBtn = screen.getByRole("button", { name: /thêm video/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [submitted] = onSubmit.mock.calls[0] as [{ videoUrl?: string }];
    // Must reflect the post-upload URL, not undefined
    expect(submitted.videoUrl).toBe("https://cdn.example.com/video-123.mp4");
  });

  it("handleSubmit falls back to manual videoUrl when no uploadedVideoUrl", async () => {
    const onSubmit = vi.fn();

    renderModal({ onSubmit, uploadedVideoUrl: undefined });

    // Navigate to video form
    const videoTile = screen.getByText("Video bài giảng");
    await act(async () => {
      fireEvent.click(videoTile);
    });

    // Fill manual URL field (placeholder "https://...")
    const urlInput = screen.getByPlaceholderText("https://...");
    await act(async () => {
      fireEvent.change(urlInput, { target: { value: "https://manual-url.example.com/v.mp4" } });
    });

    const submitBtn = screen.getByRole("button", { name: /thêm video/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [submitted] = onSubmit.mock.calls[0] as [{ videoUrl?: string }];
    expect(submitted.videoUrl).toBe("https://manual-url.example.com/v.mp4");
  });
});
