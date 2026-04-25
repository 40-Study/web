import { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface CourseLearnLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${title} - Học`,
    description: `Đang học khóa học ${title}`,
  };
}

// Skeleton for lesson content area
function LessonContentSkeleton() {
  return (
    <div className="flex-1 p-5 space-y-4">
      <Skeleton className="aspect-video rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}

export default function CourseLearnLayout({ children }: CourseLearnLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Suspense fallback={<LessonContentSkeleton />}>
        {children}
      </Suspense>
    </div>
  );
}
