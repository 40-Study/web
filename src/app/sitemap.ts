import type { MetadataRoute } from "next";
import { listPublishedCoursesServer } from "@/lib/server-fetchers/course";
import { SITE_URL, PUBLIC_INDEXABLE_PATHS } from "@/lib/seo";

/**
 * Sitemap — chỉ trang xem được khi CHƯA đăng nhập.
 *
 * Trang chi tiết khóa học (/courses/[slug]) nằm ở group (main) nên công khai;
 * URL sinh động từ danh sách khóa học đã publish. Backend chết -> fetcher trả
 * mảng rỗng, sitemap vẫn build với route tĩnh thay vì làm vỡ `next build`.
 *
 * KHÔNG đưa vào: mọi route trong group (app)/(teacher)/(admin) vì bị RoleGuard,
 * và /certificates/verify/[number] vì chứa dữ liệu cá nhân người học.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_INDEXABLE_PATHS.map(
    (path) => ({
      url: `${SITE_URL}${path === "/" ? "" : path}`,
      lastModified: now,
      changeFrequency: path === "/" ? "daily" : "weekly",
      priority: path === "/" ? 1 : 0.7,
    })
  );

  const courses = await listPublishedCoursesServer();
  const courseEntries: MetadataRoute.Sitemap = courses.map((c) => ({
    url: `${SITE_URL}/courses/${encodeURIComponent(c.slug!)}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...courseEntries];
}
