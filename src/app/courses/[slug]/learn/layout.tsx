import { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCourseBySlugServer } from "@/lib/server-fetchers/course";
import { LearnRouteGuard } from "./learn-route-guard";

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
  // Tên thật từ API công khai; dựng từ slug thì mất dấu tiếng Việt (QA-A-08).
  const course = await getCourseBySlugServer(slug);
  const name = course?.title ?? "Khoá học";

  return {
    title: `Học · ${name}`,
    description: `Đang học khoá học ${name}`,
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

export default async function CourseLearnLayout({ children, params }: CourseLearnLayoutProps) {
  const { slug } = await params;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LearnRouteGuard slug={slug}>
        <Suspense fallback={<LessonContentSkeleton />}>
          {children}
        </Suspense>
      </LearnRouteGuard>
    </div>
  );
}
