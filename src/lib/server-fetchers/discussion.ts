/**
 * Server-side fetch cho bài thảo luận CÔNG KHAI (GET /discussions/:slug không cần đăng nhập —
 * discussion_router.go:16). Dùng cho generateMetadata của trang chi tiết (og:title khi chia sẻ link).
 * Như `course.ts`: không forward cookie, trả null khi không có/backend chết để trang tự xử lý.
 */

import { getPublicApiBaseUrl } from "./base-url";

export interface PublicDiscussionSummary {
  title: string;
  content?: string;
}

export async function getDiscussionBySlugServer(
  slug: string
): Promise<PublicDiscussionSummary | null> {
  try {
    const res = await fetch(`${getPublicApiBaseUrl()}/discussions/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { data?: PublicDiscussionSummary };
    return json.data?.title ? json.data : null;
  } catch {
    return null;
  }
}
