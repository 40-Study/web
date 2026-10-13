import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTeacherPublicProfileServer } from "@/lib/server-fetchers/teacher";

/**
 * Layout phía server của hồ sơ giảng viên công khai: giảng viên không tồn tại -> `notFound()` ở đây (trước khi stream
 * HTML) để trả 404 thật; page.tsx là client nên không tự làm được (review QA2 #9). Backend lỗi thì KHÔNG 404.
 * Chỉ dùng tên + bio công khai cho metadata.
 */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const result = await getTeacherPublicProfileServer(params.id);
  if (result.status === "not-found") notFound();
  if (result.status === "unavailable") return { title: "Giảng viên" };

  const { profile } = result;
  const name = profile.full_name?.trim() || profile.user_name;
  const description = profile.bio?.trim().slice(0, 200) || `Hồ sơ giảng viên ${name} và các khoá học trên ForteX.`;
  return { title: name, description };
}

export default function TeacherProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
