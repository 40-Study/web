import { Metadata } from "next";

interface CourseLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = params.slug;
  const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${title} - Khóa học`,
    description: `Chi tiết khóa học ${title}`,
  };
}

export default function CourseDetailLayout({ children }: CourseLayoutProps) {
  return <>{children}</>;
}
