"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ChevronRight, Star } from "lucide-react";
import Link from "next/link";
import { VideoPlayer } from "@/components/lesson/video-player";
import {
  PlayerHeader,
  PlayerLessonSidebar,
  PlayerTabs,
  FloatingButtons,
  CodeEditorModal,
} from "@/components/player";
import { QuizPlayer, QuizResult, CodeExercise } from "@/components/exercise";
import {
  mockPlayerCourse,
  getLessonById,
  getAdjacentLessons,
} from "@/lib/mock-data/course-player";
import { getQuizByLessonId } from "@/lib/mock-data/quiz-data";
import { getExerciseByLessonId } from "@/lib/mock-data/exercise-data";

/** Video lesson content — video player + title/rating + tabs */
function VideoLessonContent({
  videoSrc, currentLesson, course, next, courseSlug,
}: {
  videoSrc: string;
  currentLesson: ReturnType<typeof getLessonById>;
  course: typeof mockPlayerCourse;
  next: ReturnType<typeof getAdjacentLessons>["next"];
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
              <span>Cập nhật 2 ngày trước</span>
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

export default function CourseLessonPage() {
  const params = useParams<{ courseSlug: string; lessonId: string }>();
  const { courseSlug, lessonId } = params;

  const [isCodeEditorOpen, setCodeEditorOpen] = useState(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string> | null>(null);
  const [quizTimeSpent, setQuizTimeSpent] = useState(0);

  const course = mockPlayerCourse;
  const exerciseCount = course.chapters
    .flatMap((ch) => ch.lessons)
    .filter((l) => (l.type === "exercise" || l.type === "quiz") && !l.completed).length;

  const currentLesson = getLessonById(course, lessonId);
  const { next } = getAdjacentLessons(course, lessonId);
  const videoSrc = currentLesson?.videoUrl ?? "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

  // Resolve quiz/exercise data for current lesson
  const quiz = getQuizByLessonId(lessonId);
  const exercise = getExerciseByLessonId(lessonId);

  /** Determine which content view to show */
  const renderContent = () => {
    // Quiz lesson — show quiz player or results
    if (currentLesson?.type === "quiz" && quiz) {
      if (quizAnswers) {
        return (
          <div className="flex-1 overflow-y-auto p-5">
            <QuizResult
              quiz={quiz}
              answers={quizAnswers}
              timeSpent={quizTimeSpent}
              onRetry={() => setQuizAnswers(null)}
            />
          </div>
        );
      }
      return (
        <div className="flex-1 overflow-y-auto p-5">
          <QuizPlayer
            quiz={quiz}
            onSubmit={(answers) => {
              setQuizAnswers(answers);
              setQuizTimeSpent(quiz.timeLimit - 0); // placeholder — real timer tracked inside
            }}
          />
        </div>
      );
    }

    // Exercise lesson — show code exercise
    if (currentLesson?.type === "exercise" && exercise) {
      return (
        <div className="flex-1 overflow-hidden">
          <CodeExercise
            exercise={exercise}
            onSubmit={(code, lang) => console.log("Submit:", lang, code)}
            onRun={(code, lang) => console.log("Run:", lang, code)}
          />
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
