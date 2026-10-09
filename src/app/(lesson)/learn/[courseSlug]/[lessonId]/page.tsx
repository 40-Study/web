"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
import { NonVideoLessonContent } from "@/components/player/non-video-lesson-content";
import { announceCourseCompleted, isCourseCompleted } from "@/components/player/lesson-progress-sync";
import { pickPrimaryContent, quizzesForTab, resolveLessonKind, toPlayerLessonType } from "@/components/player/lesson-kind";
import { ArticleContentView } from "@/components/lesson/article-content-view";
import { resolveLivestreamRoomHref } from "@/lib/lesson-content-link";
import type { LessonProgressResponse } from "@/services/enrollment.service";
import type { Quiz } from "@/services/quiz.service";
import { QuizAttemptReview } from "@/components/quiz";
import { useCourseBySlug } from "@/hooks/queries/use-courses";
import { useMyEnrollments } from "@/hooks/queries/use-enrollments";
import { useSections } from "@/hooks/queries/use-sections";
import { useLessonContents } from "@/hooks/queries/use-lesson-content";
import { useHlsInfo } from "@/hooks/use-hls";
import { HlsAuthError } from "@/services/hls.service";
import {
  extractUploadId,
  pickVideoSource,
  signedQueryOf,
  VIDEO_PROCESSING_MESSAGE,
} from "@/lib/hls-playback";
import {
  useQuiz,
  useStartQuiz,
  useSubmitQuiz,
  useQuizzesByLesson,
  useSaveQuizAnswer,
  useQuizAttemptDetail,
} from "@/hooks/queries/use-quiz";
import { resolveResumeSeconds, findPreviousLesson } from "@/lib/lesson-lock";
import { NotFoundError } from "@/lib/errors";
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
 *
 * `currentLessonType`: curriculum KHÔNG trả loại bài học (`lesson.type` deprecated, luôn rỗng) nên
 * loại chỉ biết được cho bài ĐANG XEM, từ lesson content (`resolveLessonKind`). Bài khác mặc định "video".
 */
function mapSectionsToChapters(
  sections: Section[],
  currentLessonType?: { lessonId: string; type: PlayerLesson["type"] }
): PlayerChapter[] {
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
      type: currentLessonType?.lessonId === lesson.id ? currentLessonType.type : "video",
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

// Nhãn tiếng Việt cho `level`/`language` thô từ API (QA 260927 student P3 — trộn
// tiếng Anh "intermediate"/"vi" trong UI tiếng Việt của trang học).
const LEVEL_LABELS_VI: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};
const LANGUAGE_LABELS_VI: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "Tiếng Anh",
};

function mapApiCourseToPlayerCourse(
  course: ApiCourse,
  sections: Section[],
  currentLessonType?: { lessonId: string; type: PlayerLesson["type"] }
): PlayerCourse {
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
    level: course.level ? (LEVEL_LABELS_VI[course.level] ?? course.level) : "",
    language: course.language
      ? (LANGUAGE_LABELS_VI[course.language] ?? course.language)
      : "Tiếng Việt",
    chapters: mapSectionsToChapters(sections, currentLessonType),
    resources: [],
    reviews: [],
  };
}

/** Bài này có bị khoá trong curriculum THÔ không (trước khi map sang PlayerLesson). */
function isLessonLockedInSections(sections: Section[], lessonId: string): boolean {
  return sections.some((s) => s.lessons?.some((l) => l.id === lessonId && l.locked === true));
}

/**
 * Nguồn XÁC THỰC cho "bài học có tồn tại trong khoá không": dựa vào curriculum THÔ (`sections`)
 * chứ KHÔNG phải PlayerCourse đã map — bản map chỉ giữ các bài đã mở (`locked === false`), nên
 * một bài CÓ THẬT nhưng đang khoá sẽ vắng mặt ở đó (xem mapSectionsToChapters).
 *
 * QA S8: URL bài học sai (course/lesson id không tồn tại) trước đây render HTTP 200 kèm thông báo
 * lỗi inline. Giờ trả 404 thật qua `notFound()`.
 */
function lessonExistsInSections(sections: Section[], lessonId: string): boolean {
  return sections.some((s) => s.lessons?.some((l) => l.id === lessonId));
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

function findRawLesson(sections: Section[], lessonId: string): Lesson | undefined {
  for (const s of sections) {
    const found = s.lessons?.find((l) => l.id === lessonId);
    if (found) return found;
  }
  return undefined;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function VideoLessonContent({
  videoSrc,
  videoUnavailableMessage,
  onSourceExpired,
  currentLesson,
  course,
  next,
  courseSlug,
  isLoading,
  subtitleUrl,
  durationSeconds,
  studentCount,
  lessonQuizzes,
  onProgress,
}: {
  videoSrc: string | null;
  /** Lý do chưa phát được (vd video đang được xử lý) — hiện thay cho "Video không khả dụng". */
  videoUnavailableMessage?: string | null;
  /** Xin URL video ký mới khi URL hiện tại hết hạn (403). */
  onSourceExpired?: () => Promise<string | null | undefined>;
  currentLesson: PlayerLesson | undefined;
  course: PlayerCourse;
  next: PlayerLesson | undefined;
  courseSlug: string;
  isLoading?: boolean;
  /** Giây thật từ lesson content (Q3) — ưu tiên hơn ước lượng từ `duration_minutes`. */
  durationSeconds?: number;
  /** Contract §4 — nguồn authoritative là lesson content (quyết định Q1). */
  subtitleUrl?: string | null;
  /** Số học viên của KHOÁ (`course.total_students`), không phải của giảng viên (A8). */
  studentCount: number;
  lessonQuizzes?: Quiz[];
  onProgress?: (progress: LessonProgressResponse) => void;
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
    // A7 (QA vòng 2, S-P1-5): pb-40 dưới lg chừa chỗ cho hai nút nổi ("Bài học"
    // bottom-24 + cao ~42px, menu công cụ bên phải) — trước đây chúng đè lên phần
    // cuối trang và không cuộn qua được.
    <div className="flex-1 min-w-0 flex flex-col overflow-y-auto p-3 sm:p-5 pb-40 lg:pb-5 gap-4">
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
            onProgressChange={onProgress}
            onClockTick={setCurrentTime}
            onToggleShortcutsHelp={() => setShortcutsOpen(true)}
            onSourceExpired={onSourceExpired}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6 text-center text-white">
            <p>{videoUnavailableMessage ?? "Video không khả dụng"}</p>
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

      <div className="bg-white rounded-2xl shadow-sm px-4 sm:px-6 pt-5 pb-4">
        {/* A7: xếp dọc dưới sm — nút "Bài tiếp theo" shrink-0 cạnh tiêu đề dài
            từng tràn ra ngoài khung ở 390px. */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 break-words">
              {currentLesson?.title ?? "Đang tải bài học..."}
            </h1>
            {/* A8 (QA vòng 2, N8): trước đây hiện "4.8/5.0 · 0 học viên" — điểm
                ghi cứng từ seed và số học viên của GIẢNG VIÊN (API không trả,
                luôn 0). Nay: điểm chỉ hiện khi có đánh giá thật, số học viên là
                của khoá. Bỏ chữ "Cập nhật gần đây" không có dữ liệu nào đứng sau. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-500">
              {course.reviewCount > 0 ? (
                <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-0.5 whitespace-nowrap">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium text-gray-700">{course.rating.toFixed(1)}/5</span>
                  <span>({course.reviewCount} đánh giá)</span>
                </div>
              ) : (
                <span className="whitespace-nowrap">Chưa có đánh giá</span>
              )}
              <span className="whitespace-nowrap">{studentCount.toLocaleString("vi-VN")} học viên</span>
            </div>
          </div>
          {next && (
            <Link
              href={`/learn/${courseSlug}/${next.id}`}
              className="self-start flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 transition-colors shrink-0 shadow-sm whitespace-nowrap"
            >
              Bài tiếp theo
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        <div className="mt-4 border-t border-gray-100 pt-1">
          <PlayerTabs course={course} lessonQuizzes={lessonQuizzes} />
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const completionAnnouncedRef = useRef(false);

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
    // S8: cần ĐỐI TƯỢNG lỗi (không phải cờ `isError`) để phân biệt 404
    // (`NotFoundError` do api-client map từ HTTP 404) với lỗi tạm thời.
    error: courseError,
    refetch: refetchCourse,
  } = useCourseBySlug(courseSlug);
  const { data: sections = [], isLoading: sectionsLoading } = useSections(apiCourse?.id ?? "");
  // S-P0-4: sidebar bài học phải dùng CÙNG nguồn tiến độ với server (enrollment
  // progress_percentage), không tự tính lại `completed/total` ở client — trước
  // đây gây lệch số % hiển thị so với /courses/[slug] và /my-courses.
  const { data: enrollments = [] } = useMyEnrollments();
  const enrollment = apiCourse
    ? enrollments.find((e) => e.course_id === apiCourse.id)
    : undefined;

  // Bài khoá (contract §2): không fetch content/quiz/HLS trước khi biết mở
  // khoá — review vòng 1 (#9). Tính trực tiếp từ `sections` THÔ (chưa qua
  // `mapApiCourseToPlayerCourse`) vì các hook dưới đây bắt buộc gọi trước mọi
  // early-return (Rules of Hooks), tức trước khi `course`/`currentLesson`
  // dựng xong. Truyền lessonId rỗng để mỗi hook tự vô hiệu hoá qua `enabled`
  // sẵn có của nó — không cần thêm tham số `enabled` mới.
  const isLessonLocked = isLessonLockedInSections(sections, lessonId);
  const { data: lessonContents, refetch: refetchLessonContents } = useLessonContents(
    isLessonLocked ? "" : lessonId
  );
  const lessonVideo = lessonContents?.find((c) => c.type === "video");
  const lessonKind = resolveLessonKind(lessonContents);
  const primaryContent = pickPrimaryContent(lessonContents);

  /**
   * A4: báo hoàn thành khoá đúng MỘT lần — chỉ khi khoá CHƯA hoàn thành lúc mở
   * trang (`completed_at` rỗng). Sau khi hoàn thành, mỗi nhịp heartbeat đều trả
   * `course_completed: true`; không có điều kiện này toast sẽ lặp lại mỗi 10 giây
   * và hiện cả khi học viên xem lại khoá đã xong.
   */
  const courseAlreadyCompleted = !!enrollment?.completed_at;
  const handleLessonProgress = useCallback(
    (progress: LessonProgressResponse) => {
      if (!isCourseCompleted(progress) || courseAlreadyCompleted || completionAnnouncedRef.current) return;
      completionAnnouncedRef.current = true;
      announceCourseCompleted(queryClient, () => router.push("/certificates"));
    },
    [courseAlreadyCompleted, queryClient, router]
  );

  // Quiz hooks
  const { data: quizzes } = useQuizzesByLesson(isLessonLocked ? "" : lessonId);
  // Quiz của bài lấy THEO `quiz_id` của content `quiz` đứng đầu (không phải `quizzes[0]` — một bài có
  // thể có nhiều quiz). Tab Quiz của player bỏ quiz này để nó không hiện hai lần (plan D2).
  const { data: lessonQuiz, isError: lessonQuizError } = useQuiz(lessonKind === "quiz" ? primaryContent?.quiz_id : undefined);
  const tabQuizzes = quizzesForTab(quizzes, lessonContents);
  const startQuizMutation = useStartQuiz();
  const submitQuizMutation = useSubmitQuiz();
  const saveAnswerMutation = useSaveQuizAnswer();
  const {
    data: submittedAttempt,
    isLoading: isLoadingAttemptDetail,
    isError: isAttemptDetailError,
  } = useQuizAttemptDetail(lessonQuiz?.id, submittedAttemptId ?? undefined);

  // Get video upload ID - prefer direct field, fallback to parsing URL
  const videoId = lessonVideo?.video_upload_id ?? extractUploadId(lessonVideo?.video_hls_url);
  // S1: /api/hls/* chỉ phục vụ URL KÝ ngắn hạn do API nội dung bài học cấp (`video_hls_url`).
  const signedQuery = signedQueryOf(lessonVideo?.video_hls_url);
  const {
    data: hlsInfo,
    isLoading: hlsLoading,
    error: hlsInfoError,
  } = useHlsInfo(videoId, signedQuery, true);

  /**
   * Xin URL video ký mới: refetch nội dung bài học rồi lấy lại nguồn phát. Player gọi khi URL bị 403
   * giữa chừng (hết hạn); trang cũng gọi khi `/info` bị 403 lúc mở bài từ cache cũ. Trả `null` nếu
   * bài không còn video/URL ký để player báo lỗi thay vì lặp vô hạn.
   */
  const refreshVideoSource = useCallback(async (): Promise<string | null> => {
    const { data: fresh } = await refetchLessonContents();
    const next = pickVideoSource(fresh?.find((c) => c.type === "video"), true);
    return next.state === "ready" ? next.src : null;
  }, [refetchLessonContents]);

  const infoAuthFailed = hlsInfoError instanceof HlsAuthError;
  const infoRefreshTriedRef = useRef(false);
  useEffect(() => {
    if (!infoAuthFailed || infoRefreshTriedRef.current) return;
    infoRefreshTriedRef.current = true;
    void refreshVideoSource().catch(() => {});
  }, [infoAuthFailed, refreshVideoSource]);

  const isLoading = courseLoading || sectionsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // S8: khoá không tồn tại (slug sai) -> 404 thật, không render 200 với thông báo lỗi inline.
  // Lỗi KHÁC (mạng/5xx) vẫn là lỗi tạm thời -> băng "thử lại".
  if (courseError) {
    if (courseError instanceof NotFoundError) notFound();
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <LessonLoadError onRetry={() => refetchCourse()} />
      </div>
    );
  }

  if (!apiCourse) notFound();

  const course = mapApiCourseToPlayerCourse(apiCourse, sections, {
    lessonId,
    type: toPlayerLessonType(lessonKind),
  });
  const currentLesson = getLessonById(course, lessonId);

  // S8: URL bài học trỏ tới bài KHÔNG có trong curriculum -> 404 thật. Dùng curriculum THÔ
  // (`sections`) vì PlayerCourse đã map chỉ giữ bài đã mở; bài tồn tại nhưng đang khoá vẫn
  // `lessonExistsInSections === true` nên KHÔNG bị 404 (đi vào nhánh LessonLockedNotice).
  if (!currentLesson && !lessonExistsInSections(sections, lessonId)) notFound();

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

  // Nguồn phát: URL HLS ký khi HLS đã sẵn sàng. Học viên KHÔNG còn được phát file gốc khi HLS chưa
  // xong (trước đây fallback /video.mp4 công khai) — họ thấy "đang xử lý". Chủ khoá/admin vẫn có
  // `video_url` (file gốc ký) để xem tạm. `/info` lỗi (không phải 403) thì thử phát thẳng URL HLS,
  // player tự báo lỗi nếu không được.
  const hlsReady = hlsInfo ? hlsInfo.hls_ready === true || hlsInfo.status === "ready" : hlsInfoError ? true : undefined;
  const videoSource = pickVideoSource(lessonVideo, videoId ? hlsReady : true);
  const videoSrc = videoSource.state === "ready" ? videoSource.src : null;
  const videoUnavailableMessage =
    videoSource.state === "processing" ? VIDEO_PROCESSING_MESSAGE : null;

  // Show loading state while HLS info is loading for video lessons
  const isVideoLoading = !!(lessonVideo && videoId && (hlsLoading || videoSource.state === "checking"));

  const exerciseCount = course.chapters
    .flatMap((ch) => ch.lessons)
    .filter((l) => (l.type === "exercise" || l.type === "quiz") && !l.completed).length;

  // Start quiz attempt
  const handleStartQuiz = async () => {
    if (!lessonQuiz?.id) {
      setQuizError("Không tìm thấy bài kiểm tra cho bài học này.");
      return;
    }
    try {
      setQuizError(null);
      const response = await startQuizMutation.mutateAsync({ quizId: lessonQuiz.id });
      setActiveQuiz(response);
    } catch {
      // Không in thẳng err.message (thông điệp tiếng Anh của backend) ra UI.
      setQuizError("Không bắt đầu được bài kiểm tra. Vui lòng thử lại.");
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
    } catch (err: unknown) {
      setQuizError(err instanceof Error ? err.message : "Không nộp được bài. Câu trả lời vẫn được lưu tạm, hãy thử nộp lại.");
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

    // Quiz lesson — loại bài lấy từ lesson content, không phải `lesson.type` (curriculum không trả).
    if (lessonKind === "quiz") {
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
              {lessonQuiz?.title || primaryContent?.title || "Bài kiểm tra"}
            </h2>
            {lessonQuiz?.description && (
              <p className="text-gray-500 mb-4">{lessonQuiz.description}</p>
            )}
            <div className="flex flex-col gap-2 text-sm text-gray-500 mb-6">
              {lessonQuiz?.time_limit_minutes ? (
                <span>Thời gian: {lessonQuiz.time_limit_minutes} phút</span>
              ) : null}
              {lessonQuiz?.max_attempts ? (
                <span>Số lần làm tối đa: {lessonQuiz.max_attempts}</span>
              ) : null}
            </div>
            {(quizError || lessonQuizError) && (
              <p className="text-red-500 text-sm mb-4">
                {quizError ?? "Không tải được bài kiểm tra này. Vui lòng tải lại trang."}
              </p>
            )}
            <button
              onClick={handleStartQuiz}
              disabled={startQuizMutation.isPending || !lessonQuiz}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startQuizMutation.isPending ? "Đang tải..." : "Bắt đầu làm bài"}
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

    // Bài viết (content `article`): hiển thị nội dung đã sanitize + "Đánh dấu đã đọc".
    if (lessonKind === "article" && currentLesson) {
      return (
        <div className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-5 pb-40 lg:pb-5 space-y-4">
          <ArticleContentView
            lessonId={lessonId}
            courseId={course.id}
            title={currentLesson.title}
            body={primaryContent?.article_body}
            readingTimeMinutes={primaryContent?.reading_time_minutes}
            completed={currentLesson.completed}
            onProgress={handleLessonProgress}
          />
          {next && (
            <Link
              href={`/learn/${courseSlug}/${next.id}`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 transition-colors shadow-sm whitespace-nowrap"
            >
              Bài tiếp theo
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
          <div className="bg-white rounded-2xl shadow-sm px-4 sm:px-6 pb-4">
            <PlayerTabs course={course} lessonQuizzes={tabQuizzes} />
          </div>
        </div>
      );
    }

    // Bài không có video: bài tập / buổi live (A2) — xem resolveLessonKind.
    if ((lessonKind === "exercise" || lessonKind === "livestream") && currentLesson) {
      const rawLesson = findRawLesson(sections, lessonId);
      const livestreamContent = lessonContents?.find((c) => c.type === "livestream");
      return (
        <div className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-5 pb-40 lg:pb-5 space-y-4">
          <NonVideoLessonContent
            kind={lessonKind}
            lessonId={lessonId}
            courseId={course.id}
            courseSlug={courseSlug}
            title={currentLesson.title}
            description={rawLesson?.description}
            completed={currentLesson.completed}
            livestreamHref={livestreamContent ? resolveLivestreamRoomHref(livestreamContent) : null}
            onProgress={handleLessonProgress}
          />
          {next && (
            <Link
              href={`/learn/${courseSlug}/${next.id}`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 transition-colors shadow-sm whitespace-nowrap"
            >
              Bài tiếp theo
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
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
        videoUnavailableMessage={videoUnavailableMessage}
        onSourceExpired={refreshVideoSource}
        subtitleUrl={lessonVideo?.subtitle_url}
        durationSeconds={lessonVideo?.duration}
        studentCount={apiCourse.total_students ?? 0}
        lessonQuizzes={tabQuizzes}
        onProgress={handleLessonProgress}
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
          serverProgressPct={enrollment?.progress_percentage}
        />
      </div>

      <FloatingButtons onSandboxOpen={() => setCodeEditorOpen(true)} />

      {isCodeEditorOpen && (
        <CodeEditorModal onClose={() => setCodeEditorOpen(false)} />
      )}
    </div>
  );
}
