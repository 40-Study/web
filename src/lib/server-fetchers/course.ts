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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
      `${API_BASE_URL}/courses/slug/${encodeURIComponent(slug)}`,
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
  try {
    const res = await fetch(`${API_BASE_URL}/courses?page_size=200`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const json = (await res.json()) as {
      data?: { courses?: PublicCourseSummary[] };
    };
    const courses = json.data?.courses ?? [];

    // Chỉ khóa học đã publish + có slug mới vào sitemap
    return courses.filter(
      (c) => !!c.slug && (c.status === undefined || c.status === "published")
    );
  } catch {
    return [];
  }
}
