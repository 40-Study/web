import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize hoá HTML do người dùng nhập trước khi render bằng dangerouslySetInnerHTML.
 *
 * Allowlist khớp với các thẻ mà TipTap thực sự sinh ra — xem `src/lib/tiptap-config.ts`:
 * - StarterKit: p, strong/b, em/i, s/del, h1-h6, ul/ol/li, blockquote, code, pre, br, hr
 * - Underline: u
 * - Image: img (src/alt/title/class)
 * - Link: a (href/target/rel/class)
 * - TaskList/TaskItem: ul[data-type=taskList], li[data-checked], label, input[type=checkbox]
 * - Mention: span[data-type=mention][data-id][data-label]
 * - CodeBlockLowlight (lowlight): pre > code với span (highlight token)
 * - Table extensions: table/thead/tbody/tr/th/td/colgroup/col
 *
 * Không cho phép: script, iframe, object, embed, form, svg/math (không nằm trong
 * ALLOWED_TAGS nên tự động bị loại), mọi thuộc tính on* (không nằm trong ALLOWED_ATTR),
 * và href/src dạng javascript: (DOMPurify tự lọc theo ALLOWED_URI_REGEXP mặc định).
 *
 * Dùng CHUNG helper này cho mọi nơi render nội dung do người dùng nhập dạng HTML —
 * không rải cấu hình DOMPurify riêng ở từng component (rules/code-conventions.md
 * "No Duplicated Logic").
 */
const ALLOWED_TAGS = [
    "p",
    "br",
    "hr",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "del",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "span",
    "div",
    "a",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "colgroup",
    "col",
    "input",
    "label",
];

const ALLOWED_ATTR = [
    "class",
    "href",
    "target",
    "rel",
    "src",
    "alt",
    "title",
    "colspan",
    "rowspan",
    "type",
    "checked",
    "disabled",
];

/**
 * Sanitize một chuỗi HTML theo allowlist tiptap ở trên. An toàn để gọi cả trên
 * server (RSC) lẫn client nhờ `isomorphic-dompurify`.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
    if (!dirty) return "";
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ALLOW_DATA_ATTR: true,
    });
}
