"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronRight, Loader2, Star } from "lucide-react";
import Link from "next/link";
import {
  PlayerHeader,
  PlayerLessonSidebar,
  PlayerTabs,
  FloatingButtons,
  CodeEditorModal,
  QuizLessonContent,
  QuizResultContent,
  HeartbeatVideo,
  LessonLockedNotice,
  LessonStudyTools,
  KeyboardShortcutsDialog,
  LessonLoadError,
} from "@/components/player";
import type { QuizResultData, StudyToolKey } from "@/components/player";
import { useCourseBySlug } from "@/hooks/queries/use-courses";
import { useSections } from "@/hooks/queries/use-sections";
import { useLessonContents } from "@/hooks/queries/use-lesson-content";
import { useHlsInfo, getVideoUrl } from "@/hooks/use-hls";
import { useStartQuiz, useSubmitQuiz, useQuizzesByLesson, useSaveQuizAnswer } from "@/hooks/queries/use-quiz";
import { resolveResumeSeconds, findPreviousLesson } from "@/lib/lesson-lock";
import { detectPlatform } from "@/lib/keyboard-shortcut-label";
import type { VideoPlayerHandle } from "@/components/lesson/video-player";
import type { StartQuizResponse } from "@/services/quiz.service";
import type { PlayerCourse, PlayerChapter, PlayerLesson } from "@/types/course-player";
import type { Section } from "@/types/section";
import type { Lesson } from "@/types/lesson";
import type { ApiCourse } from "@/services/course.service";

// ─── Backend → PlayerCourse mapping ────────────────────────────────────────

/**
 * Backend → PlayerCourse mapping.
 *
 * `locked` / `lock_reason` / `progress` đến TỪ SERVER (contract §2) — KHÔNG suy ra
 * ở client. Trước đây chỗ này gán `locked: !lesson.is_preview`, tức mọi bài không
 * phải preview đều bị khoá, kể cả bài đã học xong. Server là nguồn duy nhất.
 */
function mapSectionsToChapters(sections: Section[]): PlayerChapter[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    lessons: (section.lessons ?? []).map((lesson: Lesson) => ({
      id: lesson.id,
      title: lesson.title,
      duration: lesson.duration ? `${Math.floor(lesson.duration / 60)}:${String(lesson.duration % 60).padStart(2, "0")}` : "00:00",
      type: lesson.type === "article" ? "reading" : (lesson.type as PlayerLesson["type"]),
      completed: lesson.progress?.status === "completed",
      locked: lesson.locked ?? false,
      lockReason: lesson.lock_reason ?? null,
      lastPositionSeconds: lesson.progress?.last_position_seconds ?? 0,
      durationSeconds: lesson.duration ?? undefined,
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
  isLoading,
}: {
  videoSrc: string | null;
  currentLesson: PlayerLesson | undefined;
  course: PlayerCourse;
  next: PlayerLesson | undefined;
  courseSlug: string;
  isLoading?: boolean;
}) {
  const lessonId = currentLesson?.id ?? "";
  const sectionId = course.chapters.find((ch) =>
    ch.lessons.some((l) => l.id === lessonId)
  )?.id;

  /**
   * Giây hiện tại được giữ trong một state nhỏ ở đây thay vì trong player: player
   * tự quản `currentTime` cho UI của nó, còn panel ghi chú/transcript cần đọc để
   * chọn mốc và cuộn theo cue. `onClockTick` bắn mỗi `timeupdate` nên đây là state
   * nóng — chỉ những component con thật sự đọc nó mới render lại.
   */
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTool, setActiveTool] = useState<StudyToolKey | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [composeToken, setComposeToken] = useState(0);
  const [prefill, setPrefill] = useState<{ text: string; timestampSeconds: number } | null>(null);
  const playerControl = useRef<VideoPlayerHandle | null>(null);

  const seekTo = (seconds: number) => playerControl.current?.seekTo(seconds);

  /**
   * Phím tắt thuộc về trang (contract §7): `B` mở ô ghi chú tại giây hiện tại,
   * `N` đóng/mở panel ghi chú. Player đã lo Space/←/→/J/L/↑/↓/</>/C; ở đây chỉ
   * nhận hai phím mà player không biết vì chúng mở UI của trang.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      if (e.code === "KeyB") {
        e.preventDefault();
        setActiveTool("notes");
        setComposeToken((n) => n + 1);
      } else if (e.code === "KeyN") {
        e.preventDefault();
        setActiveTool((tool) => (tool === "notes" ? null : "notes"));
      } else if (e.code === "Escape") {
        setActiveTool(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-5 gap-4">
      <div className="rounded-2xl overflow-hidden shadow-sm bg-black aspect-video">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        ) : videoSrc && lessonId ? (
          <HeartbeatVideo
            src={videoSrc}
            lessonId={lessonId}
            courseId={course.id}
            resumeSeconds={resolveResumeSeconds(
              currentLesson?.lastPositionSeconds,
              currentLesson?.durationSeconds
            )}
            subtitleUrl={currentLesson?.subtitleUrl}
            controlRef={playerControl}
            onClockTick={setCurrentTime}
            onToggleShortcutsHelp={() => setShortcutsOpen(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <p>Video không khả dụng</p>
          </div>
        )}
      </div>

      {lessonId && (
        <LessonStudyTools
          lessonId={lessonId}
          courseId={course.id}
          lessonTitle={currentLesson?.title}
          sectionId={sectionId}
          subtitleUrl={currentLesson?.subtitleUrl}
          currentTime={currentTime}
          onSeek={seekTo}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          composeToken={composeToken}
          prefill={prefill}
          onPrefillFromTranscript={(next) => {
            setPrefill(next);
            setActiveTool("notes");
          }}
        />
      )}

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

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        platform={detectPlatform()}
      />
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
  const [activeQuiz, setActiveQuiz] = useState<StartQuizResponse | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResultData | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  const {
    data: apiCourse,
    isLoading: courseLoading,
    isError: courseError,
    refetch: refetchCourse,
  } = useCourseBySlug(courseSlug);
  const { data: sections = [], isLoading: sectionsLoading } = useSections(apiCourse?.id ?? "");
  const { data: lessonContents } = useLessonContents(lessonId);
  const lessonVideo = lessonContents?.find((c) => c.type === "video");

  // Quiz hooks
  const { data: quizzes } = useQuizzesByLesson(lessonId);
  const lessonQuiz = quizzes?.[0]; // Assume one quiz per lesson
  const startQuizMutation = useStartQuiz();
  const submitQuizMutation = useSubmitQuiz();
  const saveAnswerMutation = useSaveQuizAnswer();

  // Get video upload ID - prefer direct field, fallback to parsing URL
  const videoId = lessonVideo?.video_upload_id
    ?? lessonVideo?.video_hls_url?.split("/hls/")?.[1]?.split("/")?.[0]
    ?? null;
  const { data: hlsInfo, isLoading: hlsLoading } = useHlsInfo(videoId, true);

  const isLoading = courseLoading || sectionsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <LessonLoadError onRetry={() => refetchCourse()} />
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
  const previous = findPreviousLesson(course, lessonId);

  /**
   * Bài chưa mở (contract §2): chặn ngay ở đây, KHÔNG tải video/quiz.
   * Backend cũng trả 403 LESSON_LOCKED cho nội dung bài khoá — chặn ở client chỉ
   * để người học thấy lý do thay vì một khung video trắng.
   */
  const isLocked = currentLesson?.locked === true;
  const lockNotice = isLocked && currentLesson ? (
    <div className="flex-1 flex items-center justify-center p-5">
      <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-2xl">
        <LessonLockedNotice
          lesson={currentLesson}
          courseSlug={courseSlug}
          previousLesson={previous}
        />
      </div>
    </div>
  ) : null;

  // Get video URL: HLS if ready, fallback to original video.mp4 endpoint
  const videoSrc = videoId && hlsInfo
    ? getVideoUrl(hlsInfo, videoId)
    : videoId
      ? `/api/hls/${videoId}/video.mp4`
      : lessonVideo?.video_url ?? null;

  // Show loading state while HLS info is loading for video lessons
  const isVideoLoading = !!(lessonVideo && videoId && hlsLoading);

  const exerciseCount = course.chapters
    .flatMap((ch) => ch.lessons)
    .filter((l) => (l.type === "exercise" || l.type === "quiz") && !l.completed).length;

  // Start quiz attempt
  const handleStartQuiz = async () => {
    if (!lessonQuiz?.id) {
      setQuizError("Khong tim thay quiz cho bai hoc nay");
      return;
    }
    try {
      setQuizError(null);
      const response = await startQuizMutation.mutateAsync({ quizId: lessonQuiz.id });
      setActiveQuiz(response);
    } catch (err: any) {
      setQuizError(err?.message || "Khong the bat dau quiz");
    }
  };

  // Submit quiz answers (API format)
  const handleQuizSubmitApi = async (
    answers: Record<string, string> | Array<{ question_id: string; selected_answer_ids: string[] }>,
    timeSpent: number
  ) => {
    if (!lessonQuiz?.id || !activeQuiz) return;

    // Convert to API format if needed
    const apiAnswers = Array.isArray(answers)
      ? answers
      : Object.entries(answers).map(([qId, aId]) => ({
          question_id: qId,
          selected_answer_ids: [aId],
        }));

    try {
      const result = await submitQuizMutation.mutateAsync({
        quizId: lessonQuiz.id,
        data: { answers: apiAnswers },
      });

      // Build quiz result data from response and active quiz
      // Note: In real implementation, the API should return full result data
      // For now, we construct it from available data
      const correctCount = apiAnswers.filter((a, idx) => {
        const question = activeQuiz.questions[idx];
        if (!question) return false;
        const correctIds = question.answers.filter((ans: any) => ans.is_correct).map((ans: any) => ans.id);
        return a.selected_answer_ids.some(id => correctIds.includes(id));
      }).length;

      const resultData: QuizResultData = {
        quiz_id: lessonQuiz.id,
        attempt_id: activeQuiz.attempt_id,
        title: activeQuiz.title,
        score: result.percentage ? Number(result.percentage) : (correctCount / activeQuiz.questions.length) * 100,
        total_points: activeQuiz.questions.length,
        earned_points: result.score ? Number(result.score) : correctCount,
        correct_count: correctCount,
        incorrect_count: apiAnswers.length - correctCount,
        skipped_count: activeQuiz.questions.length - apiAnswers.length,
        total_questions: activeQuiz.questions.length,
        time_spent_seconds: timeSpent,
        is_passed: result.is_passed ?? (correctCount / activeQuiz.questions.length >= 0.7),
        pass_percentage: lessonQuiz.pass_percentage ?? 70,
        answers: activeQuiz.questions.map((q, idx) => {
          const submitted = apiAnswers[idx];
          const selectedIds = submitted?.selected_answer_ids || [];
          const correctIds = q.answers.filter((a: any) => a.is_correct).map((a: any) => a.id);
          const isCorrect = selectedIds.some(id => correctIds.includes(id));

          return {
            id: `answer-${idx}`,
            question_id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.answers.map((a: any, aIdx: number) => ({
              id: a.id,
              key: String.fromCharCode(65 + aIdx),
              text: a.answer_text,
              is_correct: correctIds.includes(a.id),
            })),
            selected_answer_ids: selectedIds,
            correct_answer_ids: correctIds,
            is_correct: isCorrect,
            points_earned: isCorrect ? 1 : 0,
            explanation: undefined, // API should provide this
          };
        }),
      };

      setQuizResult(resultData);
      setQuizTimeSpent(timeSpent);
      setQuizAnswers(Array.isArray(answers) ? {} : answers);
    } catch (err: any) {
      console.error("Submit quiz error:", err);
    }
  };

  // Save answer in progress (auto-save)
  const handleSaveAnswer = (questionId: string, answerIds: string[]) => {
    if (!activeQuiz?.attempt_id) return;
    saveAnswerMutation.mutate({
      attemptId: activeQuiz.attempt_id,
      questionId,
      selectedAnswerIds: answerIds,
    });
  };

  // Reset quiz to try again
  const handleRetryQuiz = () => {
    setQuizAnswers(null);
    setActiveQuiz(null);
    setQuizResult(null);
    setQuizError(null);
  };

  const renderContent = () => {
    if (lockNotice) return lockNotice;

    // Quiz lesson
    if (currentLesson?.type === "quiz") {
      // Quiz completed - show result
      if (quizResult) {
        return (
          <QuizResultContent
            result={quizResult}
            onRetry={handleRetryQuiz}
          />
        );
      }

      // Quiz in progress (API mode)
      if (activeQuiz) {
        return (
          <QuizLessonContent
            apiQuiz={activeQuiz}
            onSubmit={handleQuizSubmitApi}
            onSaveAnswer={handleSaveAnswer}
            isSubmitting={submitQuizMutation.isPending}
          />
        );
      }

      // Quiz start screen
      return (
        <div className="flex-1 overflow-y-auto p-5 flex items-center justify-center">
          <div className="text-center bg-white rounded-2xl shadow-sm p-8 max-w-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {lessonQuiz?.title || "Bai kiem tra"}
            </h2>
            {lessonQuiz?.description && (
              <p className="text-gray-500 mb-4">{lessonQuiz.description}</p>
            )}
            <div className="flex flex-col gap-2 text-sm text-gray-500 mb-6">
              {lessonQuiz?.time_limit_minutes && (
                <span>Thoi gian: {lessonQuiz.time_limit_minutes} phut</span>
              )}
              {lessonQuiz?.max_attempts && (
                <span>So lan lam toi da: {lessonQuiz.max_attempts}</span>
              )}
            </div>
            {quizError && (
              <p className="text-red-500 text-sm mb-4">{quizError}</p>
            )}
            <button
              onClick={handleStartQuiz}
              disabled={startQuizMutation.isPending || !lessonQuiz}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startQuizMutation.isPending ? "Dang tai..." : "Bat dau lam bai"}
            </button>
            {/* Trang riêng (contract §6): cùng bài quiz, thêm chế độ luyện tập
                không tính điểm — link từ curriculum qua GET /lessons/:id/quizzes
                đã fetch ở trên (`lessonQuiz`). */}
            {lessonQuiz?.id && (
              <Link
                href={`/quizzes/${lessonQuiz.id}`}
                className="mt-3 block text-sm text-blue-600 hover:underline"
              >
                Mở trang làm bài riêng (có chế độ luyện tập)
              </Link>
            )}
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
        isLoading={isVideoLoading}
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
