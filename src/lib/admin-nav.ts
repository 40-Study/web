/**
 * Mục menu admin nào đang được xem. "/admin" (Tổng quan) chỉ sáng khi đứng đúng trang tổng quan:
 * so khớp tiền tố `${href}/` làm "/admin" khớp MỌI trang con nên mục Tổng quan luôn sáng cùng mục
 * đang xem (QA B-13). Mục khác vẫn sáng cả ở trang con (vd. /admin/orders/<id>).
 */
export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Mục menu admin ứng với trang đang xem (cùng quy tắc khớp với `isAdminNavActive`); không thuộc menu nào thì undefined. */
export function findActiveAdminNavItem<T extends { href: string }>(pathname: string, items: readonly T[]): T | undefined {
  return items.find((item) => isAdminNavActive(pathname, item.href));
}
