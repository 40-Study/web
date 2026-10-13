import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Quy ước chính tả (quyết định sản phẩm): dấu thanh đặt ở nguyên âm THỨ HAI của oa/oe/uy
 * ("khoá", "xoá", "hoà", "thuỷ", "huỷ", "tuỳ"), KHÔNG phải "khóa/xóa/hòa/thủy/hủy".
 * "qu" giữ nguyên ("quý", "quỳ") vì u thuộc phụ âm đầu.
 */
const NEW_STYLE = /[óòỏõọÓÒỎÕỌ][aeAE]|(?<![qQ])[úùủũụÚÙỦŨỤ][yY]/g;
const SRC_ROOT = path.resolve(import.meta.dirname, "..");
// e2e/ cũng được quét theo cùng quy ước (Playwright specs), không chỉ src/.
const E2E_ROOT = path.resolve(import.meta.dirname, "..", "..", "e2e");
const SELF = path.basename(import.meta.filename);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) && name !== SELF ? [full] : [];
  });
}

/** Liệt kê mọi dòng vi phạm trong `root`, kèm đường dẫn tương đối + số dòng. */
function scanRoot(root: string): string[] {
  const offenders: string[] = [];
  for (const file of sourceFiles(root)) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        const hit = line.match(NEW_STYLE);
        if (hit) offenders.push(`${path.relative(root, file)}:${i + 1} -> ${hit.join(", ")}`);
      });
  }
  return offenders;
}

describe("chính tả tiếng Việt thống nhất kiểu cũ (oa/oe/uy)", () => {
  it("không còn từ đặt dấu ở nguyên âm đầu trong src/", () => {
    expect(scanRoot(SRC_ROOT)).toEqual([]);
  });

  it("không còn từ đặt dấu ở nguyên âm đầu trong e2e/", () => {
    expect(scanRoot(E2E_ROOT)).toEqual([]);
  });

  it("regex bắt đúng kiểu mới và bỏ qua kiểu cũ / qu*", () => {
    const sample = "khóa Xóa hòa thủy Hủy tùy | khoá xoá hoà thuỷ huỷ tuỳ quý quỳ";
    expect(sample.match(NEW_STYLE)).toEqual(["óa", "óa", "òa", "ủy", "ủy", "ùy"]);
  });
});
