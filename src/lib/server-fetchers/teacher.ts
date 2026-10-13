/**
 * Server-side fetch hồ sơ giảng viên CÔNG KHAI (route không cần đăng nhập, nên không forward cookie).
 * Dùng cho `generateMetadata` của /teachers/[id]: biết giảng viên có tồn tại hay không TRƯỚC khi trả HTML,
 * để id lạ nhận 404 thật thay vì 200 + "not found" vẽ ở client.
 */

import type { PublicTeacherProfile } from "@/services/teacher.service";
import { getPublicApiBaseUrl } from "./base-url";

export type TeacherProfileFetchResult =
  | { status: "ok"; profile: PublicTeacherProfile }
  | { status: "not-found" }
  | { status: "unavailable" };

/**
 * 404 (không phải giảng viên đang hoạt động) và 400 (id sai định dạng) là "không có trang này". Mọi lỗi khác
 * (5xx, mạng) là `unavailable`: caller KHÔNG được coi đó là 404 — backend sập không được làm cả trang biến mất.
 */
export async function getTeacherPublicProfileServer(id: string): Promise<TeacherProfileFetchResult> {
  try {
    const res = await fetch(`${getPublicApiBaseUrl()}/teachers/${encodeURIComponent(id)}/public-profile`, {
      next: { revalidate: 300 },
    });
    if (res.status === 404 || res.status === 400) return { status: "not-found" };
    if (!res.ok) return { status: "unavailable" };
    const json = (await res.json()) as { data?: PublicTeacherProfile };
    return json.data ? { status: "ok", profile: json.data } : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}
