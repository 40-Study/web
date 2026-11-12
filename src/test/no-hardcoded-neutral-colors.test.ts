/**
 * Chặn màu trung tính cứng tái xuất hiện (UX-A-06, B-03, C-02): bg-white, bg-gray-100,
 * text-gray-900... không đổi theo dark mode, gây "thẻ trắng chữ sáng". Dùng token thay thế:
 * bg-card / bg-muted / text-foreground / text-muted-foreground / border-border / border-input.
 *
 * Chỉ bắt dạng gốc (không tiền tố biến thể, không độ trong /NN). Màu trên lớp phủ ảnh/video
 * (bg-white/90...) vẫn được phép.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "..");

const HARDCODED =
  /(?<![\w:/-])(bg-white|bg-(?:gray|slate)-(?:50|100|200)|text-(?:gray|slate)-(?:500|600|700|800|900)|text-black|border-(?:gray|slate)-(?:100|200))(?![\w/-])/g;

/**
 * File được phép giữ màu cố định, kèm lý do. Thêm file vào đây chỉ khi màu đó PHẢI giống nhau
 * ở cả hai chế độ.
 */
const ALLOWED = new Set(
  [
    "components/certificate/certificate-view.tsx", // giấy chứng nhận để in: luôn nền trắng
    "components/settings/appearance-settings.tsx", // ô xem trước chế độ Sáng
    "components/course/course-hero.tsx", // nút trắng trên hero màu chủ đạo
    "components/course/course-banner-carousel.tsx", // nút trên ảnh banner
    "components/student/current-course-hero.tsx", // thẻ trắng trên hero gradient tối
    "components/course/wishlist-button.tsx", // nút tròn nổi trên ảnh bìa khoá học
    "components/landing/hero-effects.tsx", // nút nổi trên hiệu ứng hero
    "components/landing/code-editor-typing.tsx", // khung soạn code tối cố định
    "components/exercise/code-exercise.tsx", // khung soạn code tối cố định
    "components/player/floating-sandbox.tsx", // sandbox code tối cố định
    "components/lesson/video-player.tsx", // điều khiển trên video
    "lib/sanitize-html.ts", // chỉ nhắc tên class trong comment
  ].map((p) => path.normalize(p))
);

function walk(dir: string, out: string[] = []): string[] {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(ent.name) && !/\.(test|spec)\.tsx?$/.test(ent.name)) out.push(p);
  }
  return out;
}

describe("Không dùng màu trung tính cứng (dark mode)", () => {
  it("mọi file ngoài danh sách cho phép chỉ dùng token màu", () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const rel = path.relative(SRC, file);
      if (ALLOWED.has(rel)) continue;
      const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
      lines.forEach((line, i) => {
        const hits = line.match(HARDCODED);
        if (hits) offenders.push(`${rel}:${i + 1} ${hits.join(", ")}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
