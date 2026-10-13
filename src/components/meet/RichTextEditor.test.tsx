import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RichTextEditor from "./RichTextEditor";

describe("RichTextEditor (F-17: tiptap duplicate extension)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("khởi tạo editor không cảnh báo trùng extension link", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(<RichTextEditor content="<p>xin chào</p>" />);
    await waitFor(() => expect(container.querySelector(".ProseMirror")).not.toBeNull());
    expect(warn.mock.calls.flat().join(" ")).not.toContain("Duplicate extension names");
  });
});
