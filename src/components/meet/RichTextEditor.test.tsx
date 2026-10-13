import { act, fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

import RichTextEditor, { RichTextViewer } from "./RichTextEditor";

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

  it("editable: click link không mở; chuyển chỉ đọc: click mở href ở tab mới", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { container } = render(<RichTextEditor content='<p><a href="https://example.com/x">liên kết</a></p>' />);
    await waitFor(() => expect(container.querySelector(".ProseMirror a")).not.toBeNull());
    await waitFor(() => expect(captured.editor).not.toBeNull());
    captured.editor!.view.posAtCoords = () => ({ pos: 1, inside: 1 });
    const anchor = container.querySelector(".ProseMirror a") as HTMLAnchorElement;

    await userEvent.click(anchor);
    expect(open).not.toHaveBeenCalled();

    act(() => captured.editor!.setEditable(false));
    await userEvent.click(anchor);
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith("https://example.com/x", "_blank", "noopener,noreferrer");
  });
});

describe("RichTextViewer (HTML tĩnh, đường chỉ đọc thật của phòng học)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("click link mở href ở tab mới và chặn điều hướng cùng tab", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { container } = render(<RichTextViewer content='<p><a href="https://example.com/y">xem</a></p>' />);
    const anchor = container.querySelector("a") as HTMLAnchorElement;

    const notPrevented = fireEvent.click(anchor);

    expect(notPrevented).toBe(false);
    expect(open).toHaveBeenCalledWith("https://example.com/y", "_blank", "noopener,noreferrer");
  });

  it("không mở href javascript:", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { container } = render(<RichTextViewer content="<p>x</p>" />);
    const a = document.createElement("a");
    a.setAttribute("href", "javascript:alert(1)");
    container.querySelector(".rich-text-viewer")!.appendChild(a);

    fireEvent.click(a);

    expect(open).not.toHaveBeenCalled();
  });
});
