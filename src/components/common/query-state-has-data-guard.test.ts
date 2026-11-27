/**
 * Q10 guard (PG-01 tìm ra ~30 trang truyền `isError` thô). Ba luật, mỗi luật có bài "bộ quét thật sự bắt được" bên dưới:
 *
 * 1. Mỗi `<QueryState isError={biểu thức} ...>` (và wrapper cục bộ `<QueryContent error={...}>` của dashboard) PHẢI nói rõ
 *    `hasData`, nếu không refetch nền lỗi sẽ lại thay cả danh sách đang xem bằng hộp lỗi. `isError` trần (không `={...}`) là
 *    nhánh lỗi dựng sẵn khi chưa có dữ liệu nên được miễn.
 * 2. `hasData={false}` là miễn có điều kiện: phải có comment lý do ngay phía trên (trong 3 dòng) hoặc ngay trong thẻ.
 * 3. Hình dạng nuốt lỗi tự dựng `isError && !data` (hoặc `=== undefined`): trang giữ dữ liệu cache khi query lỗi mà không báo gì
 *    (Q10 #148 H1). File có hình dạng này PHẢI import `StaleDataNotice` (hoặc rơi vào danh sách miễn ghi lý do bên dưới), và
 *    `showStaleNotice={false}` cũng chỉ hợp lệ trong file import `StaleDataNotice` (notice cấp trang thay cho notice của widget).
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "../..");

/** Wrapper đọc trạng thái lỗi: tên thẻ + tên prop báo lỗi. */
const WRAPPERS = [
  { name: "QueryState", errorProp: "isError" },
  { name: "QueryContent", errorProp: "error" },
] as const;

/**
 * File được miễn luật 3 (đường dẫn tính từ `src/`, KÈM LÝ DO). Chỉ thêm khi file thuộc PR khác đang sửa đúng chỗ đó, HOẶC file đã có banner tự dựng cho ca còn dữ liệu cache (ghi tên
 * banner); phải xoá dòng khi PR kia merge (guard sẽ báo nếu dòng miễn không còn cần thiết).
 */
const SILENT_SHAPE_EXEMPT: Record<string, string> = {
  // Q11-STU-01: hai file dưới đây CÓ nhánh riêng cho ca "còn dòng cache + refetch lỗi" (banner tự dựng, có "Thử lại");
  // hình dạng `isError && x.length === 0` chỉ là nhánh màn lỗi toàn trang khi chưa có gì để hiện.
  "app/(app)/messages/page.tsx": "banner riêng showConvBanner cho ca còn hội thoại cache",
  "components/chat/conversation-chat.tsx": "banner riêng showBanner cho ca còn tin nhắn cache",
};

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(full);
  }
  return out;
}

/** Thẻ mở `<Tên ...>`: dừng ở `>` đầu tiên nằm ngoài `{}` và không phải phần `=>`. */
function openingTags(source: string, name: string): { tag: string; line: number; start: number }[] {
  const tags: { tag: string; line: number; start: number }[] = [];
  let from = 0;
  for (;;) {
    const start = source.indexOf(`<${name}`, from);
    if (start < 0) return tags;
    from = start + 1;
    if (!/\s/.test(source[start + name.length + 1] ?? "")) continue;
    let depth = 0;
    let end = start;
    for (; end < source.length; end++) {
      const c = source[end];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0 && source[end - 1] !== "=") break;
    }
    tags.push({ tag: source.slice(start, end + 1), line: source.slice(0, start).split("\n").length, start });
  }
}

/** Bỏ comment (giữ nguyên số dòng) để hình dạng nằm trong comment không bị tính. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (_m, pre: string) => pre);
}

const has = (tag: string, prop: string) => new RegExp(`\\b${prop}=`).test(tag);
const hasRaw = (tag: string, errorProp: string) => new RegExp(`\\b${errorProp}=\\{`).test(tag);

/** Thẻ có prop lỗi dạng biểu thức mà thiếu `hasData`. */
export function missingHasData(source: string): { line: number }[] {
  return WRAPPERS.flatMap(({ name, errorProp }) =>
    openingTags(source, name)
      .filter(({ tag }) => hasRaw(tag, errorProp) && !has(tag, "hasData"))
      .map(({ line }) => ({ line }))
  );
}

/** `hasData={false}` mà không có comment lý do (trong thẻ hoặc 3 dòng phía trên). */
export function unjustifiedHasDataFalse(source: string): { line: number }[] {
  const lines = source.split("\n");
  return WRAPPERS.flatMap(({ name }) => openingTags(source, name))
    .filter(({ tag }) => /\bhasData=\{false\}/.test(tag))
    .filter(({ tag, line }) => {
      if (/\/\/|\/\*/.test(tag)) return false;
      const above = lines.slice(Math.max(0, line - 4), line - 1).join("\n");
      return !/\/\/|\/\*/.test(above);
    })
    .map(({ line }) => ({ line }));
}

/** Hình dạng tự dựng nuốt lỗi: `<tên có Error/Failed> && !<ident>` hoặc `... === undefined`. Gọi hàm (`!isX(err)`) không tính. */
const NEGATED = /\b[A-Za-z_]*(?:[Ee]rror|Failed)[A-Za-z_]*\s*&&\s*!\s*(?![\w.]*\s*\()[A-Za-z_]/;
const UNDEFINED_CHECK = /\b[A-Za-z_]*(?:[Ee]rror|Failed)[A-Za-z_]*\s*&&\s*[\w.]+\s*===\s*undefined/;
// Q11-STU-01: dạng "có dòng thì giữ, không có dòng thì hiện lỗi" (`isError && posts.length === 0`): /discussions giữ bài cache khi
// refetch lỗi mà không báo gì vì chỉ nhánh rỗng đọc `isError`.
const EMPTY_LENGTH_CHECK = /(?<!!)\b[A-Za-z_]*(?:[Ee]rror|Failed)[A-Za-z_]*\s*&&\s*[\w.?]+\.length\s*(?:===?\s*0|<\s*1)\b/;
export function silentShapeLines(source: string): number[] {
  return stripComments(source)
    .split("\n")
    .flatMap((text, i) =>
      NEGATED.test(text) || UNDEFINED_CHECK.test(text) || EMPTY_LENGTH_CHECK.test(text) ? [i + 1] : []
    );
}

const importsStaleNotice = (source: string) => /import\s*\{[^}]*\bStaleDataNotice\b[^}]*\}\s*from/.test(source);

describe("QueryState guard (Q10)", () => {
  const files = walk(SRC);
  const sources = new Map(files.map((f) => [path.relative(SRC, f), readFileSync(f, "utf8")]));

  it("quét được các trang thật (không quét trống)", () => {
    const total = [...sources.values()].flatMap((s) => openingTags(s, "QueryState")).length;
    expect(total).toBeGreaterThan(40);
    expect([...sources.values()].filter((s) => silentShapeLines(s).length > 0).length).toBeGreaterThan(5);
  });

  it("luật 1: không có thẻ nào truyền lỗi dạng biểu thức mà thiếu hasData", () => {
    const offenders = [...sources].flatMap(([rel, s]) => missingHasData(s).map(({ line }) => `${rel}:${line}`));
    expect(offenders).toEqual([]);
  });

  it("luật 2: hasData={false} phải có comment lý do", () => {
    const offenders = [...sources].flatMap(([rel, s]) => unjustifiedHasDataFalse(s).map(({ line }) => `${rel}:${line}`));
    expect(offenders).toEqual([]);
  });

  it("luật 3: file giữ dữ liệu cache khi lỗi (`isError && !data`) phải import StaleDataNotice", () => {
    const offenders = [...sources].flatMap(([rel, s]) =>
      silentShapeLines(s).length > 0 && !importsStaleNotice(s) && !(rel in SILENT_SHAPE_EXEMPT)
        ? silentShapeLines(s).map((line) => `${rel}:${line}`)
        : []
    );
    expect(offenders).toEqual([]);
  });

  it("luật 3: showStaleNotice={false} chỉ hợp lệ trong file có StaleDataNotice cấp trang", () => {
    const offenders = [...sources].flatMap(([rel, s]) =>
      /\bshowStaleNotice=\{false\}/.test(stripComments(s)) && !importsStaleNotice(s) ? [rel] : []
    );
    expect(offenders).toEqual([]);
  });

  it("danh sách miễn không chứa file đã hết cần (không để miễn mồ côi)", () => {
    // Miễn chỉ để chờ PR kia: file đã import StaleDataNotice thì miễn vô nghĩa, phải bỏ dòng. (File chưa có trên nhánh này
    // hoặc chưa có hình dạng thì miễn vẫn giữ: PR #147 mới là chỗ thêm hình dạng đó.)
    const stale = Object.keys(SILENT_SHAPE_EXEMPT).filter((rel) => {
      const s = sources.get(rel);
      return s !== undefined && importsStaleNotice(s);
    });
    expect(stale).toEqual([]);
  });
});

describe("bộ quét thật sự bắt được từng loại vi phạm (không xanh vì quét sai)", () => {
  it("luật 1: thiếu hasData, kể cả wrapper cục bộ QueryContent", () => {
    expect(missingHasData("<QueryState isLoading={a} isError={b} onRetry={() => c()}>x</QueryState>")).toHaveLength(1);
    expect(missingHasData("<QueryContent loading={a} error={b.isError} retry={r}>x</QueryContent>")).toHaveLength(1);
    expect(missingHasData("<QueryState isError={b} hasData={d !== undefined} onRetry={() => c()}>x</QueryState>")).toHaveLength(0);
    expect(missingHasData("<QueryContent loading={a} error={b} hasData={c} retry={r}>x</QueryContent>")).toHaveLength(0);
    expect(missingHasData("<QueryState isError error={e}>{null}</QueryState>")).toHaveLength(0);
  });

  it("luật 2: hasData={false} không lý do bị bắt, có comment thì qua", () => {
    expect(unjustifiedHasDataFalse("<QueryState isError={b} hasData={false}>x</QueryState>")).toHaveLength(1);
    expect(
      unjustifiedHasDataFalse("// luôn là lần tải đầu, không có cache\n<QueryState isError={b} hasData={false}>x</QueryState>")
    ).toHaveLength(0);
    expect(unjustifiedHasDataFalse("<QueryState isError={b} hasData={false /* lần tải đầu */}>x</QueryState>")).toHaveLength(0);
  });

  it("luật 3: bắt `isError && !data`, `xError && !xData`, `=== undefined`; bỏ qua gọi hàm và comment", () => {
    expect(silentShapeLines("if (isError && !data) return null;")).toEqual([1]);
    expect(silentShapeLines("const a = 1;\nconst f = gradesError && !gradesData ? a : b;")).toEqual([2]);
    expect(silentShapeLines("const failed = isError && cart === undefined;")).toEqual([1]);
    expect(silentShapeLines("if (!post && error && !isResourceUnavailableError(error)) return;")).toEqual([]);
    expect(silentShapeLines("// isError && !data là hình dạng bị cấm\nconst ok = 1;")).toEqual([]);
    expect(silentShapeLines("{/* isError && !data */}")).toEqual([]);
    // Q11-STU-01: dạng "rỗng" bằng độ dài mảng
    expect(silentShapeLines(") : isError && posts.length === 0 ? (")).toEqual([1]);
    expect(silentShapeLines("const dead = isError && rows.length == 0;")).toEqual([1]);
    expect(silentShapeLines("const dead = isError && data?.items.length < 1;")).toEqual([1]);
    expect(silentShapeLines("const ok = isError && rows.length > 0;")).toEqual([]);
  });
});
