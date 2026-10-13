import { Editor } from "@tiptap/core";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildExtensions } from "./tiptap-config";

/**
 * Quyết định người dùng: link trong rich text — đang soạn thảo thì click KHÔNG mở, chỉ đọc thì click MỞ.
 * @tiptap/extension-link 3.x đổi `openOnClick: "whenNotEditable"` thành `true` và plugin click của nó chỉ bỏ qua
 * khi view KHÔNG editable → ngược hẳn ý định. Vì vậy test này kiểm tra HÀNH VI (window.open), không kiểm tra giá trị option.
 */
const HREF = "https://example.com/bai-viet";

function mountWithLink() {
    const element = document.createElement("div");
    document.body.appendChild(element);
    const editor = new Editor({
        extensions: buildExtensions(),
        element,
        content: `<p><a href="${HREF}">liên kết</a></p>`,
    });
    // jsdom không có layout nên ProseMirror không đổi toạ độ → vị trí; giả lập để handleClick của plugin vẫn chạy
    // như trên trình duyệt thật (đường dẫn đã gây lỗi ở bản 99b08e5).
    editor.view.posAtCoords = () => ({ pos: 1, inside: 1 });
    const anchor = element.querySelector("a") as HTMLAnchorElement;
    return { editor, element, anchor };
}

describe("buildExtensions: mở link khi click (hành vi, không phải giá trị option)", () => {
    afterEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("đang soạn thảo: click link KHÔNG gọi window.open", async () => {
        const open = vi.spyOn(window, "open").mockImplementation(() => null);
        const { editor, anchor } = mountWithLink();
        expect(editor.isEditable).toBe(true);

        await userEvent.click(anchor);

        expect(open).not.toHaveBeenCalled();
        editor.destroy();
    });

    it("chỉ đọc: click link mở href ở tab mới với noopener", async () => {
        const open = vi.spyOn(window, "open").mockImplementation(() => null);
        const { editor, anchor } = mountWithLink();
        editor.setEditable(false);

        await userEvent.click(anchor);

        expect(open).toHaveBeenCalledTimes(1);
        expect(open).toHaveBeenCalledWith(HREF, "_blank", "noopener,noreferrer");
        editor.destroy();
    });

    it("chuyển lại sang soạn thảo: click không mở nữa", async () => {
        const open = vi.spyOn(window, "open").mockImplementation(() => null);
        const { editor, anchor } = mountWithLink();
        editor.setEditable(false);
        editor.setEditable(true);

        await userEvent.click(anchor);

        expect(open).not.toHaveBeenCalled();
        editor.destroy();
    });

    it("chỉ đọc: không mở href nguy hiểm (javascript:)", async () => {
        const open = vi.spyOn(window, "open").mockImplementation(() => null);
        const { editor, anchor } = mountWithLink();
        anchor.setAttribute("href", "javascript:alert(1)");
        editor.setEditable(false);

        await userEvent.click(anchor);

        expect(open).not.toHaveBeenCalled();
        editor.destroy();
    });
});
