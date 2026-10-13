import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata, plainTextExcerpt } from "@/lib/page-metadata";
import { getTeacherPublicProfileServer } from "@/lib/server-fetchers/teacher";

/**
 * Layout phía server của hồ sơ giảng viên công khai: giảng viên không tồn tại -> `notFound()` ở đây (trước khi stream
 * HTML) để trả 404 thật; page.tsx là client nên không tự làm được (review QA2 #9). Backend lỗi thì KHÔNG 404.
 * Chỉ dùng tên + bio công khai cho metadata; qua buildPageMetadata (PG-M1) để og:title/canonical riêng theo giảng viên.
 */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const path = `/teachers/${encodeURIComponent(params.id)}`;
  const result = await getTeacherPublicProfileServer(params.id);
  if (result.status === "not-found") notFound();
  if (result.status === "unavailable") {
    return buildPageMetadata({
      title: "Giảng viên",
      description: "Hồ sơ giảng viên trên ForteX — xem chuyên môn và các khoá học đang giảng dạy.",
      path,
    });
  }

  const { profile } = result;
  const name = profile.full_name?.trim() || profile.user_name;
  const fallbackDescription = profile.specialization
    ? `${name} — giảng viên ${profile.specialization} trên ForteX.`
    : `Hồ sơ giảng viên ${name} và các khoá học trên ForteX.`;
  return buildPageMetadata({
    title: name,
    description: plainTextExcerpt(profile.bio ?? "") || fallbackDescription,
    path,
    images: profile.avatar_url ? [{ url: profile.avatar_url, alt: name }] : undefined,
  });
}

export default function TeacherProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
