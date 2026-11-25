/**
 * QA6 S6-07: ô "Bắt đầu một cuộc thảo luận..." chỉ có placeholder nên trình đọc màn hình không biết nó là ô gì.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/editor/tiptap-editor", () => ({ TiptapEditor: () => null }));

import { DiscussionComposer } from "./discussion-composer";

describe("DiscussionComposer — tên truy cập", () => {
  it("ô tiêu đề có tên truy cập", () => {
    render(<DiscussionComposer onSubmit={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Tiêu đề thảo luận" })).toBeTruthy();
  });
});
