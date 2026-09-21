import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { DiscussionComment } from "./discussion-comment";
import type { ForumComment } from "@/types/discussion";

/**
 * Kiểm chứng bằng render component (R9 — không được ghi dữ liệu XSS vào backend
 * đang chạy của user, port 5000 chỉ ĐỌC): dựng một comment với payload độc trong
 * `content` — đúng như dữ liệu backend trả về không qua sanitize — và khẳng
 * định DOM sau khi render KHÔNG còn onerror/script/iframe, còn định dạng hợp
 * lệ (đậm, danh sách) vẫn hiển thị.
 */
function buildComment(content: string): ForumComment {
    return {
        id: "c1",
        content,
        author_id: "u1",
        author_name: "Kẻ tấn công",
        created_at: new Date().toISOString(),
        upvote_count: 0,
        replies: [],
    };
}

describe("DiscussionComment — chống stored XSS", () => {
    it("không render onerror/script/iframe khi comment.content chứa payload độc", () => {
        const maliciousContent =
            '<p>chào</p><img src=x onerror=alert(1)><script>alert(2)</script>' +
            '<iframe src="https://evil.example"></iframe>' +
            '<a href="javascript:alert(3)">click</a>';

        const { container } = render(
            <DiscussionComment
                comment={buildComment(maliciousContent)}
                onVote={vi.fn()}
                onReply={vi.fn()}
            />
        );

        // Không còn thẻ/thuộc tính nguy hiểm trong DOM đã render
        expect(container.querySelector("script")).toBeNull();
        expect(container.querySelector("iframe")).toBeNull();
        expect(container.innerHTML).not.toContain("onerror");
        expect(container.innerHTML).not.toContain("javascript:");

        // Nội dung text an toàn vẫn hiển thị
        expect(container.textContent).toContain("chào");
    });

    it("vẫn giữ định dạng hợp lệ (đậm, danh sách) khi content sạch", () => {
        const safeContent = "<p><strong>Đậm</strong></p><ul><li>Mục 1</li></ul>";

        const { container } = render(
            <DiscussionComment
                comment={buildComment(safeContent)}
                onVote={vi.fn()}
                onReply={vi.fn()}
            />
        );

        expect(container.querySelector("strong")?.textContent).toBe("Đậm");
        expect(container.querySelector("li")?.textContent).toBe("Mục 1");
    });
});
