import type { MetadataRoute } from "next";
import { SITE_URL, PUBLIC_INDEXABLE_PATHS } from "@/lib/seo";

/**
 * Sitemap — CHỈ liệt kê trang thật sự xem được khi chưa đăng nhập.
 *
 * ⚠️ Vì sao KHÔNG có /courses/[slug] (trang chi tiết khóa học):
 * trang đó nằm ở src/app/(app)/courses/[slug]/ — tức trong group (app), mà
 * (app)/layout.tsx bọc <RoleGuard>. Khách chưa đăng nhập không xem được nội
 * dung. Đưa URL bị chặn vào sitemap sẽ khiến Google thấy trang rỗng/redirect
 * và bị coi là soft-404 — hại SEO hơn là không khai báo.
 * Muốn index chi tiết khóa học thì phải chuyển trang đó ra group công khai
 * (vd. (main)) trước, rồi thêm nhánh fetch động vào đây.
 *
 * Trang tra cứu chứng chỉ theo mã (/certificates/verify/[number]) cũng KHÔNG
 * vào sitemap: chứa dữ liệu cá nhân của người học.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_INDEXABLE_PATHS.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
