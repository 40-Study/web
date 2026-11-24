/// <reference types="vite/client" />
/**
 * QA6-A08: mọi trang /admin/** và /org/** chỉ có tiêu đề tab "ForteX". Mỗi mục menu của hai khu phải có layout riêng
 * khai báo `metadata`, và tab render ra đúng "<nhãn menu> | ForteX" theo thuật toán thật của Next (cùng cách với
 * section-title-template.test.ts). Thêm mục menu mà quên layout thì test đỏ, không cần nhớ cập nhật danh sách.
 */
import { describe, expect, it, vi } from "vitest";
import type { Metadata } from "next";
import { resolveTitle } from "next/dist/lib/metadata/resolvers/resolve-title";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter" }),
  Plus_Jakarta_Sans: () => ({ variable: "font-heading" }),
}));

import { metadata as rootMetadata } from "../layout";
import { adminMenu } from "@/lib/admin-menu";
import { orgMenu } from "@/lib/org-menu";

// Dấu ngoặc của route group là cú pháp nhóm trong glob nên phải escape; khoá kết quả vẫn là đường dẫn nguyên văn.
const layouts = import.meta.glob<{ metadata?: Metadata }>(
  ["../\\(admin\\)/admin/**/layout.tsx", "../\\(org\\)/org/**/layout.tsx"],
  { eager: true }
);

function tabTitle(layout: Metadata): string {
  const root = resolveTitle(rootMetadata.title, null);
  return resolveTitle(layout.title, root.template).absolute;
}

/** Mục có nhãn "Tổng quan" quá chung khi đứng một mình trên tab nên đặt tiêu đề riêng (xem area-metadata). */
const INDEX_TITLES: Record<string, string> = {
  "/admin": "Tổng quan quản trị",
  "/org": "Tổng quan tổ chức",
};

describe.each([
  ["admin", "../(admin)", adminMenu],
  ["org", "../(org)", orgMenu],
])("tiêu đề tab khu %s", (_area, prefix, menu) => {
  it.each(menu.map((item) => [item.href, item.label] as const))("%s có layout với tiêu đề riêng", (href, label) => {
    const layout = layouts[`${prefix}${href}/layout.tsx`];
    expect(layout, `thiếu ${prefix}${href}/layout.tsx`).toBeDefined();
    expect(layout.metadata?.title, `${href}: layout không export metadata.title`).toBeDefined();
    expect(tabTitle(layout.metadata as Metadata)).toBe(`${INDEX_TITLES[href] ?? label} | ForteX`);
  });
});
