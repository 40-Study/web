/**
 * QA-A-07/A-08: trang con (chi tiết khoá học, chi tiết cuộc thi, kết quả tra cứu chứng chỉ, bài tập của khoá)
 * mất hậu tố " | ForteX". Nguyên nhân: layout cha đặt `title` là CHUỖI, mà Next 14 chỉ truyền xuống segment con
 * `title.template` của layout gần nhất — chuỗi làm template thành null.
 *
 * Test chạy đúng thuật toán của Next (`resolveTitle` + quy tắc truyền template của resolve-metadata) trên
 * metadata THẬT của từng layout cha: revert một layout về title chuỗi thì test đỏ.
 */
import { describe, expect, it, vi } from "vitest";
import type { Metadata } from "next";
// Hàm nội bộ Next dùng để dựng <title>: test chạy đúng thuật toán thật thay vì tự mô phỏng.
import { resolveTitle } from "next/dist/lib/metadata/resolvers/resolve-title";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter" }),
  Plus_Jakarta_Sans: () => ({ variable: "font-heading" }),
}));

import { metadata as rootMetadata } from "../layout";
import { metadata as mainCoursesMetadata } from "../(main)/courses/layout";
import { metadata as discussionsMetadata } from "../(main)/discussions/layout";
import { metadata as verifyMetadata } from "../(main)/certificates/verify/layout";
import { metadata as contestsMetadata } from "../(app)/contests/layout";
import { metadata as appCoursesMetadata } from "../(app)/courses/layout";
import { metadata as groupsMetadata } from "../(app)/groups/layout";

/** Tiêu đề tab của trang con có title "Tên trang", nằm dưới root -> layout cha. */
function childTabTitle(parent: Metadata, childTitle: string): string {
  const root = resolveTitle(rootMetadata.title, null);
  const parentResolved = resolveTitle(parent.title, root.template);
  return resolveTitle(childTitle, parentResolved.template).absolute;
}

describe.each([
  ["(main)/courses -> /courses/[slug]", mainCoursesMetadata],
  ["(main)/discussions -> /discussions/[slug]", discussionsMetadata],
  ["(main)/certificates/verify -> /certificates/verify/[number]", verifyMetadata],
  ["(app)/contests -> /contests/[slug]", contestsMetadata],
  ["(app)/courses -> /courses/[slug]/exercises", appCoursesMetadata],
  ["(app)/groups -> /groups/[slug]", groupsMetadata],
])("%s", (_name, parent) => {
  it("trang con vẫn có hậu tố ' | ForteX'", () => {
    expect(childTabTitle(parent, "Tên trang")).toBe("Tên trang | ForteX");
  });

  it("chính trang của layout cũng có hậu tố", () => {
    const root = resolveTitle(rootMetadata.title, null);
    expect(resolveTitle(parent.title, root.template).absolute).toMatch(/ \| ForteX$/);
  });
});
