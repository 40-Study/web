import { notFound, redirect } from "next/navigation";
import { fetchCurriculum } from "@/lib/server-fetchers/curriculum";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}

/**
 * Route CŨ — chuyển hẳn sang redirect server-side tới player mới
 * `/learn/{slug}/{lessonId}` (BLOCKER review vòng 1, PR #17, #1).
 *
 * Player cũ (`player-client.tsx`) từng tự gọi
 * `updateProgress.mutate({status: "completed"})` ngay trong `onEnded` — tua
 * tới cuối video là xong bài, bỏ qua toàn bộ heartbeat chống tua mới. Đó là vi
 * phạm thẳng success criteria "không có API cho client set completed trực
 * tiếp". Giữ route này để không vỡ link cũ (đã lưu/bookmark, chia sẻ), nhưng
 * không còn render player cũ — chỉ resolve lesson rồi chuyển hướng.
 */
export default async function CourseLearnRedirectPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { lesson: lessonId } = await searchParams;

  // Giữ nguyên `?lesson=` nếu có — không cần tải curriculum để biết đích.
  if (lessonId) {
    redirect(`/learn/${slug}/${lessonId}`);
  }

  const curriculum = await fetchCurriculum(slug);
  if (!curriculum) notFound();

  const firstLessonId = curriculum.sections[0]?.lessons[0]?.id;
  if (!firstLessonId) notFound();

  redirect(`/learn/${slug}/${firstLessonId}`);
}
