import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// A-10 (QA hồi quy 03/10): landing quảng cáo "Trợ giảng AI 24/7" trong khi sản phẩm không có AI
// (/ai-chat đã redirect về /home). Quét chữ hiển thị của landing + footer để lỗi không quay lại.
const LANDING_DIR = __dirname;
const FOOTER = path.join(__dirname, "..", "layout", "footer.tsx");
const AI_CLAIM = /\bAI\b|trợ giảng|trợ lý ảo|gia sư ảo/i;

function sourceFiles(): string[] {
  const landing = fs
    .readdirSync(LANDING_DIR)
    .filter((f) => /\.tsx$/.test(f) && !/\.test\./.test(f))
    .map((f) => path.join(LANDING_DIR, f));
  return [...landing, FOOTER];
}

describe("landing và footer không quảng cáo AI", () => {
  it("không còn chữ AI / trợ giảng / trợ lý ảo trong mã nguồn hiển thị", () => {
    const hits: string[] = [];
    for (const file of sourceFiles()) {
      fs.readFileSync(file, "utf8")
        .split("\n")
        // Bỏ dòng comment: chú thích tiếng Việt có thể nhắc tới AI để giải thích vì sao đã gỡ.
        .filter((line) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line))
        .forEach((line, i) => {
          if (AI_CLAIM.test(line)) hits.push(`${path.basename(file)}:${i + 1}: ${line.trim()}`);
        });
    }
    expect(hits).toEqual([]);
  });
});
