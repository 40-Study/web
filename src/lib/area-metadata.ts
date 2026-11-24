import type { Metadata } from "next";
import { sectionTitle } from "@/lib/page-metadata";

/**
 * QA6-A08: mọi trang /admin/** và /org/** chỉ có tiêu đề tab "ForteX" (login và 404 thì có riêng). Tiêu đề lấy từ
 * mục menu của chính khu đó (`adminMenu` / `orgMenu`, SSOT của sidebar) nên đổi tên mục thì tab đổi theo, không có
 * bảng tiêu đề thứ hai để lệch. `override` cho mục có nhãn quá chung khi đứng một mình trên tab (vd. "Tổng quan").
 * Thiếu mục menu cho `href` là lỗi cấu hình: ném lỗi thay vì lặng lẽ rơi về "ForteX" trơn.
 */
export function areaMetadata(
  menu: readonly { href: string; label: string }[],
  href: string,
  override?: string
): Metadata {
  const item = menu.find((entry) => entry.href === href);
  if (!item) throw new Error(`areaMetadata: không có mục menu cho "${href}"`);
  return { title: sectionTitle(override ?? item.label) };
}
