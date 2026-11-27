/**
 * Q9-PG-07: axe `color-contrast` trên /settings và hồ sơ giảng viên (QA9). jsdom không tính được tương phản nên chốt bằng
 * quét mã nguồn: chữ nhạt (gray-400, red-500, blue/primary-500, emerald/amber-600) không được dùng làm CHỮ trên nền sáng
 * (icon thì được), thẻ 2FA không phủ `opacity-70` lên cả chữ (gray-500 -> 2.76:1, huy hiệu -> 3.12:1).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..", "..");
const settingsDir = __dirname;
const settingsFiles = readdirSync(settingsDir)
  .filter((n) => n.endsWith(".tsx") && !n.includes(".test."))
  .map((n) => ({ name: n, text: readFileSync(join(settingsDir, n), "utf8") }));
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

/** Dòng JSX là CHỮ (thẻ p/span) chứ không phải icon (`<Icon className=...>`). */
const textLines = (text: string) => text.split("\n").filter((l) => /<(p|span|h[1-6]|label)\b/.test(l));

describe("trang cài đặt — chữ đủ tương phản (Q9-PG-07)", () => {
  it.each(["text-gray-400", "text-red-500", "text-primary-500", "text-blue-500"])("không có chữ %s trên nền sáng", (cls) => {
    const hits = settingsFiles.flatMap((f) =>
      textLines(f.text)
        .filter((l) => new RegExp(`(?<![\\w:-])${cls}(?![\\w-])`).test(l) && !l.includes(`dark:${cls}`))
        .map((l) => `${f.name}: ${l.trim()}`),
    );
    expect(hits).toEqual([]);
  });

  it("thẻ 2FA 'Sắp ra mắt' không phủ opacity lên chữ; chỉ công tắc bị mờ", () => {
    const account = settingsFiles.find((f) => f.name === "account-settings.tsx")!.text;
    const card = account.slice(account.indexOf("2FA — coming soon"), account.indexOf("Xác thực hai lớp"));
    expect(card).not.toMatch(/opacity-\d+/);
  });

  it("màu chữ của vai trò (emerald/amber) dùng -700", () => {
    const account = settingsFiles.find((f) => f.name === "account-settings.tsx")!.text;
    expect(account).not.toMatch(/color: "text-(emerald|amber)-600"/);
  });

  it("nhãn 'Đã xác minh' ở hồ sơ giảng viên dùng emerald-700", () => {
    expect(read("app/(main)/teachers/[id]/page.tsx")).not.toMatch(/text-emerald-600/);
  });
});
