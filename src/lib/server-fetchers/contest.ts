/**
 * Server-side fetch cuộc thi cho `generateMetadata` của trang chi tiết (G-09, QA3 261104: tab hiện
 * "Cuộc thi | ForteX" thay vì tên cuộc thi; N-03, QA4 261123: link chia sẻ mang og:title/mô tả của trang danh
 * sách). `GET /contests/:slug` là OptionalAuth nên gọi ẩn danh được, như `course.ts` KHÔNG forward cookie.
 * Cuộc thi chỉ người đăng nhập mới thấy (404 với khách) hoặc backend chết -> `null`, layout rơi về metadata
 * chung "Cuộc thi". 404 thật do middleware dò (`lib/missing-resource-probe.ts`, có chuyển tiếp cookie).
 */
import { getPublicApiBaseUrl } from "./base-url";

export interface PublicContestSummary {
  title: string;
  description: string | null;
  banner_url: string | null;
}

export async function getContestBySlugServer(slug: string): Promise<PublicContestSummary | null> {
  try {
    const res = await fetch(`${getPublicApiBaseUrl()}/contests/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { data?: Partial<PublicContestSummary> };
    const data = json.data;
    if (!data?.title) return null;
    return { title: data.title, description: data.description ?? null, banner_url: data.banner_url ?? null };
  } catch {
    return null;
  }
}
