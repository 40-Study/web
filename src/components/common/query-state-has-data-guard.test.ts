/**
 * Q10 guard (PG-01 tìm ra ~30 trang truyền `isError` thô): mỗi `<QueryState isError={biểu thức} ...>` PHẢI nói rõ `hasData`
 * (có dữ liệu cache hay không), nếu không refetch nền lỗi sẽ lại thay cả danh sách đang xem bằng hộp lỗi.
 * `isError` trần (không có `={...}`) là nhánh lỗi dựng sẵn khi chưa có dữ liệu nên được miễn. Muốn miễn thật sự thì phải
 * truyền `hasData={false}` và viết lý do ngay cạnh.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(full);
  }
  return out;
}

/** Thẻ mở `<QueryState ...>`: dừng ở `>` đầu tiên nằm ngoài `{}` và không phải phần `=>`. */
function openingTags(source: string): { tag: string; line: number }[] {
  const tags: { tag: string; line: number }[] = [];
  let from = 0;
  for (;;) {
    const start = source.indexOf("<QueryState", from);
    if (start < 0) return tags;
    from = start + 1;
    if (!/\s/.test(source[start + "<QueryState".length] ?? "")) continue;
    let depth = 0;
    let end = start;
    for (; end < source.length; end++) {
      const c = source[end];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0 && source[end - 1] !== "=") break;
    }
    tags.push({ tag: source.slice(start, end + 1), line: source.slice(0, start).split("\n").length });
  }
}

describe("QueryState guard: isError thô phải đi cùng hasData (Q10)", () => {
  const files = walk(SRC);

  it("quét được các trang thật (không quét trống)", () => {
    const total = files.flatMap((f) => openingTags(readFileSync(f, "utf8"))).length;
    expect(total).toBeGreaterThan(40);
  });

  it("không có <QueryState isError={...}> nào thiếu hasData", () => {
    const offenders: string[] = [];
    for (const file of files) {
      for (const { tag, line } of openingTags(readFileSync(file, "utf8"))) {
        if (/\bisError=\{/.test(tag) && !/\bhasData=/.test(tag)) {
          offenders.push(`${path.relative(SRC, file)}:${line}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("bộ quét thật sự bắt được thẻ thiếu hasData (không phải xanh vì quét sai)", () => {
    const [bad] = openingTags("<QueryState isLoading={a} isError={b} onRetry={() => c()}>x</QueryState>");
    expect(/\bisError=\{/.test(bad.tag) && !/\bhasData=/.test(bad.tag)).toBe(true);
    const [ok] = openingTags("<QueryState isError={b} hasData={d.length > 0} onRetry={() => c()}>x</QueryState>");
    expect(/\bisError=\{/.test(ok.tag) && !/\bhasData=/.test(ok.tag)).toBe(false);
  });
});
