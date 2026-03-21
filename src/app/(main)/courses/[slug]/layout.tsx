import { Metadata } from "next";
import { getMockCourseDetail } from "@/lib/mock-data/courses";

interface CourseLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const course = getMockCourseDetail(params.slug);

  if (!course) {
    return {
      title: "Khóa học không tồn tại",
    };
  }

  return {
    title: course.title,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      images: [course.thumbnail],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description: course.description,
      images: [course.thumbnail],
    },
  };
}

export default function CourseDetailLayout({ children }: CourseLayoutProps) {
  return <>{children}</>;
}
