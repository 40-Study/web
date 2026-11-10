import { Metadata } from "next";
import { getCourseBySlugServer } from "@/lib/server-fetchers/course";

interface CourseLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

/**
 * Metadata trang bài tập của khoá (`/courses/[slug]/exercises`).
 * Trước đây dựng tên từ slug ("Python Cho Khoa Hoc Du Lieu", mất dấu — QA-A-08); nay lấy tên thật
 * từ API công khai, không lấy được thì dùng tên chung.
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const course = await getCourseBySlugServer(params.slug);
  const name = course?.title ?? "Khoá học";

  return {
    title: `Bài tập · ${name}`,
    description: `Bài tập của khoá học ${name} trên ForteX.`,
  };
}

export default function CourseDetailLayout({ children }: CourseLayoutProps) {
  return <>{children}</>;
}
