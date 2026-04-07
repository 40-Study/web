"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ChevronRight, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { VideoPlayer } from "@/components/lesson/video-player";
import {
  PlayerHeader,
  PlayerLessonSidebar,
  PlayerTabs,
  FloatingButtons,
  CodeEditorModal,
} from "@/components/player";
import { useCourseBySlug } from "@/hooks/queries/use-courses";
import { useSections } from "@/hooks/queries/use-sections";
import { useLessonContents } from "@/hooks/queries/use-lesson-content";
import type { PlayerCourse, PlayerChapter, PlayerLesson } from "@/types/course-player";
import type { Section } from "@/types/section";
import type { Lesson } from "@/types/lesson";
import type { ApiCourse } from "@/services/course.service";

// ─── Backend → PlayerCourse mapping ────────────────────────────────────────

function mapSectionsToChapters(sections: Section[]): PlayerChapter[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    lessons: (section.lessons ?? []).map((lesson: Lesson) => ({
      id: lesson.id,
      title: lesson.title,
      duration: lesson.duration ? `${Math.floor(lesson.duration / 60)}:${String(lesson.duration % 60).padStart(2, "0")}` : "00:00",
      type: lesson.type === "article" ? "reading" : (lesson.type as PlayerLesson["type"]),
      completed: false,
      locked: !lesson.is_preview,
    })),
  }));
}

function mapApiCourseToPlayerCourse(course: ApiCourse, sections: Section[]): PlayerCourse {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug ?? "",
    description: course.description ?? course.short_description ?? "",
    instructor: {
      name: course.instructor?.name ?? "Giảng viên",
      avatar: course.instructor?.avatar,
      title: course.instructor?.title ?? "",
      rating: Number(course.instructor?.rating ?? 0),
      studentCount: course.instructor?.student_count ?? 0,
      courseCount: course.instructor?.course_count ?? 0,
    },
    rating: Number(course.average_rating ?? 0),
    reviewCount: course.total_reviews ?? 0,
    level: course.level ?? "",
    language: course.language ?? "Tiếng Việt",
    chapters: mapSectionsToChapters(sections),
    resources: [],
    reviews: [],
  };
}

function getLessonById(course: PlayerCourse, lessonId: string): PlayerLesson | undefined {
  for (const chapter of course.chapters) {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (lesson) return lesson;
  }
  return undefined;
}

function getNextLesson(course: PlayerCourse, lessonId: string): PlayerLesson | undefined {
  const allLessons = course.chapters.flatMap((ch) => ch.lessons);
  const idx = allLessons.findIndex((l) => l.id === lessonId);
  return idx < allLessons.length - 1 ? allLessons[idx + 1] : undefined;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function VideoLessonContent({
  videoSrc,
  currentLesson,
  course,
  next,
  courseSlug,
}: {
  videoSrc: string;
  currentLesson: PlayerLesson | undefined;
  course: PlayerCourse;
  next: PlayerLesson | undefined;
  courseSlug: string;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-5 gap-4">
      <div className="rounded-2xl overflow-hidden shadow-sm bg-black">
        <VideoPlayer src={videoSrc} className="rounded-none" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm px-6 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {currentLesson?.title ?? "Đang tải bài học..."}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-0.5">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="font-medium text-gray-700">{course.rating}/5.0</span>
              </div>
              <span>{course.instructor.studentCount.toLocaleString()} học viên</span>
              <span>•</span>
              <span>Cập nhật gần đây</span>
            </div>
          </div>
          {next && (
            <Link
              href={`/learn/${courseSlug}/${next.id}`}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 transition-colors shrink-0 shadow-sm"
            >
              Bài tiếp theo
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        <div className="mt-4 border-t border-gray-100 pt-1">
          <PlayerTabs course={course} courseSlug={courseSlug} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function CourseLessonPage() {
  const params = useParams<{ courseSlug: string; lessonId: string }>();
  const { courseSlug, lessonId } = params;

  const [isCodeEditorOpen, setCodeEditorOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string> | null>(null);
  const [quizTimeSpent, setQuizTimeSpent] = useState(0);

  const { data: apiCourse, isLoading: courseLoading } = useCourseBySlug(courseSlug);
  const { data: sections = [], isLoading: sectionsLoading } = useSections(apiCourse?.id ?? "");
  const { data: lessonContents } = useLessonContents(lessonId);
  const lessonVideo = lessonContents?.find((c) => c.type === "video");

  const isLoading = courseLoading || sectionsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!apiCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Không tìm thấy khóa học.</p>
      </div>
    );
  }

  const course = mapApiCourseToPlayerCourse(apiCourse, sections);
  const currentLesson = getLessonById(course, lessonId);
  const next = getNextLesson(course, lessonId);

  const videoSrc = lessonVideo?.video_url ?? "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

  const exerciseCount = course.chapters
    .flatMap((ch) => ch.lessons)
    .filter((l) => (l.type === "exercise" || l.type === "quiz") && !l.completed).length;

  const renderContent = () => {
    // Quiz lesson
    if (currentLesson?.type === "quiz") {
      if (quizAnswers) {
        return (
          <div className="flex-1 overflow-y-auto p-5 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>Đã nộp bài. Tính năng xem kết quả quiz đang được phát triển.</p>
              <button
                onClick={() => setQuizAnswers(null)}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm"
              >
                Làm lại
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="flex-1 overflow-y-auto p-5 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>Tính năng quiz đang được phát triển.</p>
          </div>
        </div>
      );
    }

    // Exercise lesson
    if (currentLesson?.type === "exercise") {
      return (
        <div className="flex-1 overflow-y-auto p-5 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>Tính năng thực hành code đang được phát triển.</p>
          </div>
        </div>
      );
    }

    // Default — video lesson
    return (
      <VideoLessonContent
        videoSrc={videoSrc}
        currentLesson={currentLesson}
        course={course}
        next={next}
        courseSlug={courseSlug}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PlayerHeader
        courseTitle={course.title}
        courseSlug={courseSlug}
        exerciseCount={exerciseCount}
      />

      <div className="flex-1 flex overflow-hidden">
        {renderContent()}

        <PlayerLessonSidebar
          chapters={course.chapters}
          currentLessonId={lessonId}
          courseSlug={courseSlug}
        />
      </div>

      <FloatingButtons onSandboxOpen={() => setCodeEditorOpen(true)} />

      {isCodeEditorOpen && (
        <CodeEditorModal onClose={() => setCodeEditorOpen(false)} />
      )}
    </div>
  );
}
