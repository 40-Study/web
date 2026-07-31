import type { Metadata } from "next";
import { getCourseBySlugServer } from "@/lib/server-fetchers/course";
import { SITE_URL } from "@/lib/seo";

/**
 * Metadata cho trang chi tiết khóa học — TRANG CÔNG KHAI.
 *
 * Layout cũ (ở group (app)) chỉ biến slug thành title bằng cách thay dấu gạch
 * nối, không hề đọc dữ liệu thật. Nay trang đã public nên fetch khóa học để có
 * title/description/ảnh OG đúng — đây mới là thứ hiện ra khi link được chia sẻ
 * lên Facebook/Zalo/LinkedIn.
 *
 * Backend chết -> trả metadata mặc định thay vì làm vỡ trang.
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const course = await getCourseBySlugServer(params.slug);
  const url = `${SITE_URL}/courses/${encodeURIComponent(params.slug)}`;

  if (!course) {
    return {
      title: "Khóa học",
      alternates: { canonical: url },
    };
  }

  const description =
    course.short_description ||
    course.description?.slice(0, 200) ||
    `Khóa học ${course.title} trên ForteX.`;

  return {
    title: course.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: course.title,
      description,
      url,
      images: course.thumbnail_url ? [{ url: course.thumbnail_url }] : undefined,
    },
    twitter: {
      card: course.thumbnail_url ? "summary_large_image" : "summary",
      title: course.title,
      description,
      images: course.thumbnail_url ? [course.thumbnail_url] : undefined,
    },
  };
}

export default function CourseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
