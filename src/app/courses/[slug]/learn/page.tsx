import { notFound } from "next/navigation";
import { fetchCurriculum } from "@/lib/server-fetchers/curriculum";
import { PlayerClient } from "./player-client";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}

export default async function CourseLearnPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { lesson: lessonId } = await searchParams;

  // Server-side data fetching
  const curriculum = await fetchCurriculum(slug);

  if (!curriculum) {
    notFound();
  }

  return (
    <PlayerClient
      courseSlug={slug}
      initialCurriculum={curriculum}
      initialLessonId={lessonId}
    />
  );
}
