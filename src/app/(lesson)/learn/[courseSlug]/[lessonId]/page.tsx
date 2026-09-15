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
  HeartbeatVideo,
  LessonLockedNotice,
  LessonStudyTools,
  KeyboardShortcutsDialog,
  LessonLoadError,
} from "@/components/player";
import type { StudyToolKey } from "@/components/player";
import { QuizAttemptReview } from "@/components/quiz";
import { useCourseBySlug } from "@/hooks/queries/use-courses";
import { useSections } from "@/hooks/queries/use-sections";
import { useLessonContents } from "@/hooks/queries/use-lesson-content";
import { useHlsInfo, getVideoUrl } from "@/hooks/use-hls";
import {
  useStartQuiz,
  useSubmitQuiz,
  useQuizzesByLesson,
  useSaveQuizAnswer,
  useQuizAttemptDetail,
} from "@/hooks/queries/use-quiz";
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
      // Review vòng 1 (#12, quyết định Q3): `lesson.duration` (@deprecated) là
      // ĐƠN VỊ PHÚT (alias của `duration_minutes`), KHÔNG phải giây — dòng cũ
      // chia nó cho 60 để lấy phút, tức coi nhầm phút thành giây. Nguồn đúng
      // là `duration_minutes` (phút, chỉ dùng hiển thị); giây thật lấy từ
      // lesson content (`lessonVideo.duration`, xem `durationSeconds` dưới).
      duration: lesson.duration_minutes
        ? `${lesson.duration_minutes}:00`
        : "00:00",
      type: lesson.type === "article" ? "reading" : (lesson.type as PlayerLesson["type"]),
      completed: lesson.progress?.status === "completed",
      locked: lesson.locked ?? false,
      lockReason: lesson.lock_reason ?? null,
      lastPositionSeconds: lesson.progress?.last_position_seconds ?? 0,
      // KHÔNG dùng `lesson.duration` cho bất kỳ phép tính nào (Q3) — dự phòng
      // thô từ phút (kém chính xác tối đa 59s); bài ĐANG XEM ưu tiên giây thật
      // từ lesson content (threaded qua prop `durationSeconds` ở VideoLessonContent).
      durationSeconds: lesson.duration_minutes ? lesson.duration_minutes * 60 : undefined,
      // BLOCKER review vòng 1 (#4): trước đây không gán field này nên
      // `currentLesson?.subtitleUrl` luôn `undefined`. Nguồn AUTHORITATIVE là
      // lesson content (`lessonVideo?.subtitle_url`, quyết định Q1) vì đó là
      // nơi backend Phase 1 trả lại sau khi ghi qua `PUT /lessons/:id`; giữ
      // field này ở đây làm dự phòng nếu curriculum cũng trả kèm.
      subtitleUrl: lesson.subtitle_url ?? null,
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

/** Bài này có bị khoá trong curriculum THÔ không (trước khi map sang PlayerLesson). */
function isLessonLockedInSections(sections: Section[], lessonId: string): boolean {
  return sections.some((s) => s.lessons?.some((l) => l.id === lessonId && l.locked === true));
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
  subtitleUrl,
  durationSeconds,
}: {
  videoSrc: string | null;
  currentLesson: PlayerLesson | undefined;
  course: PlayerCourse;
  next: PlayerLesson | undefined;
  courseSlug: string;
  isLoading?: boolean;
  /** Giây thật từ lesson content (Q3) — ưu tiên hơn ước lượng từ `duration_minutes`. */
  durationSeconds?: number;
  /** Contract §4 — nguồn authoritative là lesson content (quyết định Q1). */
  subtitleUrl?: string | null;
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
              durationSeconds ?? currentLesson?.durationSeconds
            )}
            subtitleUrl={subtitleUrl ?? currentLesson?.subtitleUrl}
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
          subtitleUrl={subtitleUrl ?? currentLesson?.subtitleUrl}
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
  const [activeQuiz, setActiveQuiz] = useState<StartQuizResponse | null>(null);
  // BLOCKER review vòng 1 (#5, quyết định Q5): KHÔNG dựng lại đúng/sai ở
  // client. Sau khi nộp chỉ giữ `attempt_id`, kết quả thật đọc qua
  // `useQuizAttemptDetail` (GET /quizzes/:id/attempts/:attemptId, contract §6).
  const [submittedAttemptId, setSubmittedAttemptId] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  const {
    data: apiCourse,
    isLoading: courseLoading,
    isError: courseError,
    refetch: refetchCourse,
  } = useCourseBySlug(courseSlug);
  const { data: sections = [], isLoading: sectionsLoading } = useSections(apiCourse?.id ?? "");

  // Bài khoá (contract §2): không fetch content/quiz/HLS trước khi biết mở
  // khoá — review vòng 1 (#9). Tính trực tiếp từ `sections` THÔ (chưa qua
  // `mapApiCourseToPlayerCourse`) vì các hook dưới đây bắt buộc gọi trước mọi
  // early-return (Rules of Hooks), tức trước khi `course`/`currentLesson`
  // dựng xong. Truyền lessonId rỗng để mỗi hook tự vô hiệu hoá qua `enabled`
  // sẵn có của nó — không cần thêm tham số `enabled` mới.
  const isLessonLocked = isLessonLockedInSections(sections, lessonId);
  const { data: lessonContents } = useLessonContents(isLessonLocked ? "" : lessonId);
  const lessonVideo = lessonContents?.find((c) => c.type === "video");

  // Quiz hooks
  const { data: quizzes } = useQuizzesByLesson(isLessonLocked ? "" : lessonId);
  const lessonQuiz = quizzes?.[0]; // Assume one quiz per lesson
  const startQuizMutation = useStartQuiz();
  const submitQuizMutation = useSubmitQuiz();
  const saveAnswerMutation = useSaveQuizAnswer();
  const {
    data: submittedAttempt,
    isLoading: isLoadingAttemptDetail,
    isError: isAttemptDetailError,
  } = useQuizAttemptDetail(lessonQuiz?.id, submittedAttemptId ?? undefined);

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

  /**
   * Nộp bài quiz nhúng trong bài học (API format).
   *
   * BLOCKER review vòng 1 (#5): bản trước dựng lại đúng/sai ở CLIENT bằng
   * `ans.is_correct` qua `as any` — field đó không tồn tại trên
   * `AttemptAnswer` (`quiz.service.ts`), nên `correctIds` luôn rỗng và mọi câu
   * bị chấm sai. Giờ chỉ lưu `attempt_id`; `useQuizAttemptDetail` đọc đúng/sai
   * + giải thích thật từ server, đúng contract §6 ("kết quả đọc từ server").
   */
  const handleQuizSubmitApi = async (
    answers: Record<string, string> | Array<{ question_id: string; selected_answer_ids?: string[] }>
  ) => {
    if (!lessonQuiz?.id || !activeQuiz) return;

    if (!Array.isArray(answers)) {
      // `apiQuiz` (StartQuizResponse) luôn gọi onSubmit với mảng — nhánh
      // Record chỉ tồn tại cho định dạng demo cũ của QuizLessonContent. Nộp
      // mảng rỗng trong im lặng ở đây sẽ mất trắng lần làm của học viên.
      setQuizError("Không đọc được câu trả lời. Vui lòng thử lại, đừng đóng trang.");
      return;
    }

    try {
      const result = await submitQuizMutation.mutateAsync({
        quizId: lessonQuiz.id,
        data: { answers },
      });
      setSubmittedAttemptId(result.id || activeQuiz.attempt_id);
    } catch (err: any) {
      setQuizError(err?.message || "Không nộp được bài. Câu trả lời vẫn được lưu tạm, hãy thử nộp lại.");
    }
  };

  /** id → chữ đáp án, lấy từ đề đã tải (không lộ đáp án đúng — chỉ có chữ). */
  const quizAnswerText = new Map(
    (activeQuiz?.questions ?? []).flatMap((q) => q.answers.map((a) => [a.id, a.answer_text] as const))
  );

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
    setActiveQuiz(null);
    setSubmittedAttemptId(null);
    setQuizError(null);
  };

  const renderContent = () => {
    if (lockNotice) return lockNotice;

    // Quiz lesson
    if (currentLesson?.type === "quiz") {
      // Đã nộp — đọc kết quả THẬT từ server, không dựng lại ở client (§6).
      if (submittedAttemptId) {
        if (isLoadingAttemptDetail) {
          return (
            <div className="flex-1 flex items-center justify-center p-5">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          );
        }
        if (isAttemptDetailError || !submittedAttempt) {
          return (
            <div className="flex-1 flex items-center justify-center p-5">
              <LessonLoadError onRetry={handleRetryQuiz} />
            </div>
          );
        }
        const percentage = submittedAttempt.percentage ?? 0;
        return (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-1">
              <h2 className="text-xl font-bold text-gray-900">
                {submittedAttempt.is_passed ? "Bạn đã đạt bài kiểm tra này" : "Bạn chưa đạt bài kiểm tra này"}
              </h2>
              <p className="text-sm text-gray-500">
                Điểm: {Math.round(percentage)}% · Đúng {submittedAttempt.answers.filter((a) => a.is_correct === true).length}/{submittedAttempt.answers.length} câu
              </p>
              <button
                onClick={handleRetryQuiz}
                className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                Làm lại
              </button>
            </div>
            <QuizAttemptReview answers={submittedAttempt.answers} answerText={quizAnswerText} />
          </div>
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
        subtitleUrl={lessonVideo?.subtitle_url}
        durationSeconds={lessonVideo?.duration}
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
