import { Fragment } from "react";

/**
 * Hiển thị đoạn chữ có `mã inline` giữa hai dấu backtick thành thẻ <code>.
 *
 * Đề bài tập code viết dạng Markdown nhẹ ("`<cờ> <tên>`", "`EMPTY`"); trước đây in nguyên dấu backtick
 * (QA3 Q15). Chỉ tách theo cặp backtick và render bằng React (escape tự động) — KHÔNG dùng
 * dangerouslySetInnerHTML. Backtick lẻ (không có cặp đóng) giữ nguyên là chữ thường.
 */
export function InlineCodeText({ text }: { text: string }) {
  const parts = text.split(/(`[^`\n]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.92em] text-foreground">
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}
