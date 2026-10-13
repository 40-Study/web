import { Editor } from "@tiptap/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildExtensions } from "./tiptap-config";

describe("buildExtensions (F-17: tiptap duplicate extension)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("không đăng ký trùng tên extension (StarterKit v3 đã gồm link + underline)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const editor = new Editor({ extensions: buildExtensions(), element: document.createElement("div") });
    const names = editor.extensionManager.extensions.map((e) => e.name);
    editor.destroy();

    expect(warn.mock.calls.flat().join(" ")).not.toContain("Duplicate extension names");
    expect(names.filter((n) => n === "link")).toHaveLength(1);
    expect(names.filter((n) => n === "underline")).toHaveLength(1);
  });

  it("link chỉ mở khi editor ở chế độ chỉ đọc (openOnClick: whenNotEditable)", () => {
    const editor = new Editor({ extensions: buildExtensions(), element: document.createElement("div") });
    const link = editor.extensionManager.extensions.find((e) => e.name === "link");
    editor.destroy();
    expect(link?.options.openOnClick).toBe("whenNotEditable");
  });

  it("giữ cấu hình link tuỳ biến (class/rel/target), không bị bản mặc định của StarterKit đè", () => {
    const editor = new Editor({
      extensions: buildExtensions(),
      element: document.createElement("div"),
      content: '<p><a href="https://example.com">x</a></p>',
    });
    const html = editor.getHTML();
    editor.destroy();
    expect(html).toContain("tiptap-link");
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
