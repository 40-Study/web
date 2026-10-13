import Link from "@tiptap/extension-link";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const OPENABLE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/** Mở href ở tab mới, tách opener. Bỏ qua href không hợp lệ hoặc giao thức ngoài danh sách (javascript:, data:...). */
export function openLinkInNewTab(href: string | null | undefined): boolean {
    if (!href) return false;
    let protocol: string;
    try {
        protocol = new URL(href, window.location.href).protocol;
    } catch {
        return false;
    }
    if (!OPENABLE_PROTOCOLS.has(protocol)) return false;
    window.open(href, "_blank", "noopener,noreferrer");
    return true;
}

/**
 * Link của rich text theo quyết định người dùng: đang soạn thảo → click KHÔNG mở (để đặt con trỏ/sửa);
 * chỉ đọc → click mở ở tab mới.
 *
 * Không dùng `openOnClick: "whenNotEditable"` của @tiptap/extension-link 3.x: nó được ánh xạ thành `true` và plugin
 * click chỉ bỏ qua khi view KHÔNG editable — tức ngược ý định. Tắt hẳn `openOnClick` rồi tự xử lý ở đây.
 */
export const ReadOnlyOpenLink = Link.extend({
    addOptions() {
        return { ...this.parent!(), openOnClick: false };
    },

    addProseMirrorPlugins() {
        return [
            ...(this.parent?.() ?? []),
            new Plugin({
                key: new PluginKey("readOnlyOpenLink"),
                props: {
                    handleDOMEvents: {
                        click: (view, event) => {
                            if (view.editable || event.button !== 0) return false;
                            const anchor = (event.target as Element | null)?.closest?.("a");
                            if (!anchor || !view.dom.contains(anchor)) return false;
                            // Chặn điều hướng gốc của <a target="_blank"> để không mở hai lần.
                            event.preventDefault();
                            openLinkInNewTab(anchor.getAttribute("href"));
                            return true;
                        },
                    },
                },
            }),
        ];
    },
});
