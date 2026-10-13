import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * F-17: `<Image fill>` thiếu `sizes` làm next/image cảnh báo và tải ảnh quá khổ (mặc định 100vw).
 * Mọi `<Image fill ...>` trong src/ phải khai báo `sizes`.
 */
const SRC_ROOT = path.resolve(import.meta.dirname, "..");

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return tsxFiles(full);
    return /\.tsx$/.test(name) && !/\.test\./.test(name) ? [full] : [];
  });
}

describe("next/image fill phải có sizes", () => {
  it("không có <Image fill> nào thiếu sizes", () => {
    const offenders: string[] = [];
    for (const file of tsxFiles(SRC_ROOT)) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/<Image\b([\s\S]*?)\/>/g)) {
        const attrs = m[1];
        if (/\bfill\b/.test(attrs) && !/\bsizes=/.test(attrs)) {
          const line = text.slice(0, m.index).split("\n").length;
          offenders.push(`${path.relative(SRC_ROOT, file)}:${line}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
