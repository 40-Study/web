import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Editor } from "@tiptap/core";

// Bắt instance editor do chính component tạo (không dựng lại config ở test), để khẳng định
// union extension của nó. Xem thêm src/lib/tiptap-config.test.ts cho builder dùng chung.
const captured = vi.hoisted(() => ({ editor: null as Editor | null }));

vi.mock("@tiptap/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tiptap/react")>();
  return {
    ...actual,
    useEditor: (...args: Parameters<typeof actual.useEditor>) => {
      captured.editor = actual.useEditor(...args);
      return captured.editor;
    },
  };
});

import RichTextEditor from "./RichTextEditor";

describe("RichTextEditor (F-17: tiptap duplicate extension)", () => {
  afterEach(() => {
    captured.editor = null;
    vi.restoreAllMocks();
  });

  it("khởi tạo editor không cảnh báo trùng extension link", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(<RichTextEditor content="<p>xin chào</p>" />);
    await waitFor(() => expect(container.querySelector(".ProseMirror")).not.toBeNull());
    expect(warn.mock.calls.flat().join(" ")).not.toContain("Duplicate extension names");
  });

  // F-17: bản StarterKit v3 đã gồm link + underline; component phải tắt bản built-in rồi tự đăng ký,
  // nếu không sẽ có HAI extension cùng tên. Nếu ai xoá `link: false` (hoặc bỏ hẳn Link.configure)
  // thì union này lệch và test ĐỎ — thay vì xanh im lặng như chỉ kiểm tra cảnh báo.
  it("đăng ký đúng một extension `link` và một `underline`", async () => {
    const { container } = render(<RichTextEditor content="<p>xin chào</p>" />);
    await waitFor(() => expect(container.querySelector(".ProseMirror")).not.toBeNull());
    await waitFor(() => expect(captured.editor).not.toBeNull());

    const names = captured.editor!.extensionManager.extensions.map((e) => e.name);
    expect(names.filter((n) => n === "link")).toHaveLength(1);
    expect(names.filter((n) => n === "underline")).toHaveLength(1);
  });

  it("link chỉ mở khi editor ở chế độ chỉ đọc (openOnClick: whenNotEditable)", async () => {
    const { container } = render(<RichTextEditor content="<p>xin chào</p>" />);
    await waitFor(() => expect(container.querySelector(".ProseMirror")).not.toBeNull());
    await waitFor(() => expect(captured.editor).not.toBeNull());

    const link = captured.editor!.extensionManager.extensions.find((e) => e.name === "link");
    expect(link?.options.openOnClick).toBe("whenNotEditable");
  });
});
