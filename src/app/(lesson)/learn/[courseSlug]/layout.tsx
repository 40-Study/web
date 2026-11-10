import type { Metadata } from "next";
import { getCourseBySlugServer } from "@/lib/server-fetchers/course";

/**
 * Tiêu đề tab cho trình phát bài học (QA-A-07: trước đây chỉ là "ForteX").
 * `page.tsx` là client component nên metadata đặt ở layout passthrough này.
 * Lấy tên khoá từ API công khai; backend không trả lời thì dùng tên chung, không làm vỡ trang.
 */
export async function generateMetadata({
  params,
}: {
  params: { courseSlug: string };
}): Promise<Metadata> {
  const course = await getCourseBySlugServer(params.courseSlug);
  return { title: course?.title ? `Học · ${course.title}` : "Bài học" };
}

export default function LessonCourseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
