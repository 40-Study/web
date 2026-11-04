/**
 * Server-side fetch tên cuộc thi cho `generateMetadata` của trang chi tiết (G-09, QA3 261104: tab hiện
 * "Cuộc thi | ForteX" thay vì tên cuộc thi). `GET /contests/:slug` là OptionalAuth nên gọi ẩn danh được,
 * như `course.ts` KHÔNG forward cookie. Cuộc thi chỉ người đăng nhập mới thấy (404 với khách) hoặc backend
 * chết -> `null`, layout rơi về tiêu đề chung "Cuộc thi".
 */
import { getPublicApiBaseUrl } from "./base-url";

export interface PublicContestSummary {
  title: string;
}

export async function getContestBySlugServer(slug: string): Promise<PublicContestSummary | null> {
  try {
    const res = await fetch(`${getPublicApiBaseUrl()}/contests/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { data?: PublicContestSummary };
    return json.data?.title ? { title: json.data.title } : null;
  } catch {
    return null;
  }
}
