/**
 * Server-side fetch cho endpoint khóa học CÔNG KHAI.
 *
 * Backend không đặt auth middleware cho các route đọc này
 * (course_router.go:29-31), nên KHÔNG dùng `serverFetch` — hàm đó forward
 * cookie người dùng, thừa và làm mọi trang thành dynamic.
 *
 * Dùng cho: generateMetadata của trang chi tiết khóa học (OpenGraph khi chia
 * sẻ link) và sitemap.xml.
 */

import { getPublicApiBaseUrl } from "./base-url";

export interface PublicCourseSummary {
  id: string;
  slug?: string;
  title: string;
  short_description?: string;
  description?: string;
  thumbnail_url?: string;
  updated_at?: string;
  status?: string;
}

/** Trả null nếu không tìm thấy hoặc backend chết — trang tự xử lý notFound. */
export async function getCourseBySlugServer(
  slug: string
): Promise<PublicCourseSummary | null> {
  try {
    const res = await fetch(
      `${getPublicApiBaseUrl()}/courses/slug/${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;

    const json = (await res.json()) as { data?: PublicCourseSummary };
    return json.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Danh sách khóa học đã publish, dùng sinh sitemap.
 *
 * Trả mảng rỗng khi backend không phản hồi — sitemap vẫn build được với các
 * route tĩnh thay vì làm vỡ cả `next build`.
 */
export async function listPublishedCoursesServer(): Promise<
  PublicCourseSummary[]
> {
  const pageSize = 100; // CourseService reset mọi giá trị > 100 về mặc định 20.
  const published: PublicCourseSummary[] = [];

  for (let page = 1; ; page += 1) {
    try {
      const res = await fetch(
        `${getPublicApiBaseUrl()}/courses?status=published&page=${page}&page_size=${pageSize}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) return published;

      const json = (await res.json()) as {
        data?: {
          courses?: PublicCourseSummary[];
          total?: number;
        };
      };
      const courses = json.data?.courses ?? [];

      published.push(
        ...courses.filter(
          (course) =>
            !!course.slug &&
            (course.status === undefined || course.status === "published")
        )
      );

      const total = json.data?.total ?? courses.length;
      if (courses.length === 0 || page * pageSize >= total) return published;
    } catch {
      // Giữ các page đã lấy được nếu backend lỗi giữa chừng.
      return published;
    }
  }
}
