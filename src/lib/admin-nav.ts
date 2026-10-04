/**
 * Mục menu admin nào đang được xem. "/admin" (Tổng quan) chỉ sáng khi đứng đúng trang tổng quan:
 * so khớp tiền tố `${href}/` làm "/admin" khớp MỌI trang con nên mục Tổng quan luôn sáng cùng mục
 * đang xem (QA B-13). Mục khác vẫn sáng cả ở trang con (vd. /admin/orders/<id>).
 */
export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}