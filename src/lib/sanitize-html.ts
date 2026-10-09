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

// ─── Profile bài viết (QA 261009 M1) ─────────────────────────────────────────────────────────────

/** Thẻ của profile chung trừ biểu mẫu: bài viết không cần ô nhập, và `input` cho phép dựng form lừa đảo. */
const ARTICLE_ALLOWED_TAGS = ALLOWED_TAGS.filter((tag) => tag !== "input" && tag !== "label");

/**
 * Không có class, style, id, data-* hay aria-*: Tailwind của app nằm sẵn trong CSS bundle, nên một `class`
 * do giáo viên nhập (`fixed inset-0 z-50 bg-white`) dựng được overlay phủ cả trình phát. `rel` cũng
 * không nằm đây: hook bên dưới tự đặt, không tin giá trị người nhập.
 */
const ARTICLE_ALLOWED_ATTR = ["href", "target", "src", "alt", "title", "colspan", "rowspan"];

const ARTICLE_LINK_REL = "noopener noreferrer nofollow";
const HTTP_URL = /^https?:\/\//i;

type ArticleNode = { nodeName: string; getAttribute(n: string): string | null; setAttribute(n: string, v: string): void; removeAttribute(n: string): void; remove(): void };

/** Chạy SAU khi DOMPurify đã lọc thuộc tính của từng phần tử; xem `sanitizeArticleHtml`. */
function enforceArticleNodeRules(node: Element) {
    const el = node as unknown as ArticleNode;
    const tag = el.nodeName.toLowerCase();
    if (tag === "img") {
        // Chỉ http(s) tuyệt đối: chặn data:, ftp:, //host và đường dẫn tương đối (không có ảnh nội bộ nào
        // trong bài viết). Ảnh từ xa vẫn lộ IP/giờ đọc cho host đó — đó là giới hạn của việc cho phép ảnh ngoài.
        if (!HTTP_URL.test((el.getAttribute("src") ?? "").trim())) el.remove();
        return;
    }
    if (tag === "a") {
        el.setAttribute("rel", ARTICLE_LINK_REL);
        if (el.getAttribute("target") !== "_blank") el.removeAttribute("target");
    }
}

/**
 * Sanitize `article_body` — nội dung giáo viên nhập, hiện cho MỌI học viên của khoá, nên chặt hơn
 * `sanitizeHtml` (vốn thiết kế cho nội dung ngang hàng). Chỉ `ArticleContentView` dùng.
 *
 * Hook của DOMPurify là trạng thái toàn cục của instance: gắn ngay trước và gỡ ngay sau lời gọi
 * (đồng bộ) để không rò sang `sanitizeHtml`.
 */
export function sanitizeArticleHtml(dirty: string | null | undefined): string {
    if (!dirty) return "";
    DOMPurify.addHook("afterSanitizeAttributes", enforceArticleNodeRules);
    try {
        return DOMPurify.sanitize(dirty, {
            ALLOWED_TAGS: ARTICLE_ALLOWED_TAGS,
            ALLOWED_ATTR: ARTICLE_ALLOWED_ATTR,
            FORBID_ATTR: ["class", "style", "id"],
            ALLOW_DATA_ATTR: false,
            ALLOW_ARIA_ATTR: false,
        });
    } finally {
        DOMPurify.removeHook("afterSanitizeAttributes", enforceArticleNodeRules);
    }
}
