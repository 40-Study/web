"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, Play, Loader2 } from "lucide-react";
import {
  PlayerHeader,
  PlayerLessonSidebar,
  PlayerTabs,
  QuizLessonContent,
  QuizResultContent,
  ExerciseLessonContent,
  FloatingButtons,
  VideoQuizOverlay,
} from "@/components/player";
import type { QuizData, ApiQuizData } from "@/components/player";
import type { QuizResultData } from "@/components/player";
import type { ExerciseData } from "@/components/player";
import {
  curriculumToPlayerCourse,
  useExercise,
  useSubmitExercise,
  useUpdateProgress,
  useLessonCompletions,
  type PlayerCurriculum,
} from "@/hooks/use-course-player";
import { quizService } from "@/services/quiz.service";
import type { VideoQuiz, PlayerCourse } from "@/types/course-player";

// ─── Video Player Component ─────────────────────────────────────────────────

function VideoLessonContent({
  lesson,
  course,
  courseSlug,
  onComplete,
  onNextLesson,
}: {
  lesson: { id: string; title: string; videoUrl?: string; description?: string };
  course: PlayerCourse;
  courseSlug: string;
  onComplete?: () => void;
  onNextLesson?: () => void;
}) {
  const updateProgress = useUpdateProgress(courseSlug);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const currentTimeRef = useRef<number>(0);
  const lessonIdRef = useRef<string>(lesson.id);

  // Store handler ref for proper cleanup
  const timeUpdateHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    lessonIdRef.current = lesson.id;
  }, [lesson.id]);

  // State declarations moved before refs that use them
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [videoQuizzes, setVideoQuizzes] = useState<VideoQuiz[]>([]);
  const [activeQuizOverlay, setActiveQuizOverlay] = useState<VideoQuiz | null>(null);

  // Proper callback ref with cleanup
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    // Cleanup previous element's listeners
    if (videoElementRef.current && timeUpdateHandlerRef.current) {
      videoElementRef.current.removeEventListener("timeupdate", timeUpdateHandlerRef.current);
      // Pause previous video to stop audio
      videoElementRef.current.pause();
      videoElementRef.current.src = "";
      timeUpdateHandlerRef.current = null;
    }

    videoElementRef.current = node;

    if (node) {
      // Create and store the handler for later cleanup
      const handleTimeUpdate = () => {
        setCurrentVideoTime(node.currentTime);
        currentTimeRef.current = node.currentTime;
      };
      timeUpdateHandlerRef.current = handleTimeUpdate;
      node.addEventListener("timeupdate", handleTimeUpdate);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (currentTimeRef.current > 0) {
        updateProgress.mutate({
          lessonId: lessonIdRef.current,
          status: "in_progress",
          videoWatchedSeconds: Math.floor(currentTimeRef.current),
        });
      }
    };
  }, [updateProgress]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentTimeRef.current > 0) {
        const data = JSON.stringify({
          lessonId: lessonIdRef.current,
          status: "in_progress",
          videoWatchedSeconds: Math.floor(currentTimeRef.current),
        });
        navigator.sendBeacon("/api/progress", data);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Full cleanup on unmount - ensures video stops completely
  useEffect(() => {
    return () => {
      if (videoElementRef.current) {
        videoElementRef.current.pause();
        videoElementRef.current.src = "";
        if (timeUpdateHandlerRef.current) {
          videoElementRef.current.removeEventListener("timeupdate", timeUpdateHandlerRef.current);
        }
      }
    };
  }, []);

  const handleVideoEnd = useCallback(() => {
    updateProgress.mutate({
      lessonId: lesson.id,
      status: "completed",
    });
    onComplete?.();
  }, [lesson.id, updateProgress, onComplete]);

  useEffect(() => {
    const pendingQuiz = videoQuizzes.find(
      (q) =>
        q.status === "pending" &&
        currentVideoTime >= q.timestamp &&
        currentVideoTime < q.timestamp + 2
    );
    if (pendingQuiz && !activeQuizOverlay) {
      if (videoElementRef.current) {
        videoElementRef.current.pause();
      }
      setActiveQuizOverlay(pendingQuiz);
      setVideoQuizzes((prev) =>
        prev.map((q) => (q.id === pendingQuiz.id ? { ...q, status: "in_progress" } : q))
      );
    }
  }, [currentVideoTime, videoQuizzes, activeQuizOverlay]);

  const handleQuizSubmit = useCallback((quizId: string, answerId: string) => {
    setVideoQuizzes((prev) =>
      prev.map((q) => {
        if (q.id === quizId) {
          const isCorrect = q.correctAnswer === answerId;
          return { ...q, status: isCorrect ? "correct" : "incorrect" };
        }
        return q;
      })
    );
    setActiveQuizOverlay(null);
    if (videoElementRef.current) {
      videoElementRef.current.play();
    }
  }, []);

  const handleQuizSkip = useCallback((quizId: string) => {
    setVideoQuizzes((prev) =>
      prev.map((q) => (q.id === quizId ? { ...q, status: "pending" } : q))
    );
    setActiveQuizOverlay(null);
    if (videoElementRef.current) {
      videoElementRef.current.play();
    }
  }, []);

  const handleQuizClick = useCallback((quiz: VideoQuiz) => {
    const video = document.querySelector("video");
    if (video) {
      video.currentTime = quiz.timestamp;
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col p-5 gap-4 overflow-y-auto">
      <div className="relative rounded-2xl overflow-hidden shadow-sm bg-gradient-to-br from-gray-900 to-gray-800 aspect-video flex items-center justify-center">
        {lesson.videoUrl ? (
          <video
            ref={videoRef}
            src={lesson.videoUrl}
            controls
            className="w-full h-full"
            onEnded={handleVideoEnd}
          />
        ) : (
          <div className="text-center text-white">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer transition-colors">
              <Play className="w-10 h-10 fill-white" />
            </div>
            <p className="text-lg font-medium">{lesson.title}</p>
            <p className="text-sm text-gray-400 mt-1">Video không khả dụng</p>
          </div>
        )}

        {activeQuizOverlay && (
          <VideoQuizOverlay
            quiz={activeQuizOverlay}
            onSubmit={handleQuizSubmit}
            onSkip={handleQuizSkip}
          />
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{lesson.title}</h1>
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
          <button
            onClick={onNextLesson}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors"
          >
            Bài tiếp theo
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <PlayerTabs
          course={course}
          courseSlug={course.slug}
          videoQuizzes={videoQuizzes}
          currentVideoTime={currentVideoTime}
          onQuizClick={handleQuizClick}
        />
      </div>
    </div>
  );
}

// ─── Quiz Wrapper Component ─────────────────────────────────────────────────

function QuizLessonWrapper({
  quizId,
  lessonId,
  courseSlug,
  onComplete,
}: {
  quizId: string;
  lessonId: string;
  courseSlug: string;
  onComplete?: () => void;
}) {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quizResult, setQuizResult] = useState<QuizResultData | null>(null);

  const updateProgress = useUpdateProgress(courseSlug);

  useEffect(() => {
    const initQuiz = async () => {
      try {
        const response = await quizService.startQuiz(quizId);
        setAttemptId(response.attempt_id);

        const mappedQuiz: QuizData = {
          id: response.quiz_id,
          title: response.title,
          timeLimitMinutes: response.time_limit_minutes ?? 30,
          questions: response.questions.map((q) => ({
            id: q.id,
            question: q.question_text,
            options: q.answers.map((a) => ({
              key: a.id,
              text: a.answer_text,
            })),
            correctAnswer: "",
          })),
        };

        setQuizData(mappedQuiz);
      } catch (error) {
        console.error("Failed to start quiz:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initQuiz();
  }, [quizId]);

  const handleQuizSubmit = (
    answers: Record<string, string> | Array<{ question_id: string; selected_answer_ids: string[] }>,
    timeSpent: number
  ) => {
    if (!attemptId) return;

    const submitData = {
      answers: Array.isArray(answers)
        ? answers
        : Object.entries(answers).map(([questionId, answerId]) => ({
            question_id: questionId,
            selected_answer_ids: [answerId],
          })),
    };

    (async () => {
      try {
        const result = await quizService.submitQuiz(quizId, submitData);
        const detail = await quizService.getAttemptDetail(quizId, result.id);

        const resultData: QuizResultData = {
          quiz_id: quizId,
          attempt_id: result.id,
          title: quizData?.title ?? "",
          score: result.percentage ?? 0,
          total_points: result.total_points ?? 0,
          earned_points: result.score ?? 0,
          correct_count: detail.answers.filter((a) => a.is_correct).length,
          incorrect_count: detail.answers.filter((a) => !a.is_correct && a.selected_answer_ids.length > 0).length,
          skipped_count: detail.answers.filter((a) => a.selected_answer_ids.length === 0).length,
          total_questions: detail.answers.length,
          time_spent_seconds: timeSpent,
          is_passed: result.is_passed ?? false,
          pass_percentage: 70,
          answers: detail.answers.map((a) => ({
            id: a.id,
            question_id: a.question_id,
            question_text: a.question_text,
            question_type: "single_choice",
            options: [],
            selected_answer_ids: a.selected_answer_ids,
            correct_answer_ids: a.correct_answer_ids ?? [],
            is_correct: a.is_correct ?? false,
            points_earned: a.points_earned,
            explanation: a.explanation,
          })),
        };

        setQuizResult(resultData);

        if (result.is_passed) {
          updateProgress.mutate({
            lessonId,
            status: "completed",
          });
          onComplete?.();
        }
      } catch (error) {
        console.error("Failed to submit quiz:", error);
      }
    })();
  };

  const handleRetry = () => {
    setQuizResult(null);
    setIsLoading(true);
    setAttemptId(null);

    quizService.startQuiz(quizId).then((response) => {
      setAttemptId(response.attempt_id);

      const mappedQuiz: QuizData = {
        id: response.quiz_id,
        title: response.title,
        timeLimitMinutes: response.time_limit_minutes ?? 30,
        questions: response.questions.map((q) => ({
          id: q.id,
          question: q.question_text,
          options: q.answers.map((a) => ({
            key: a.id,
            text: a.answer_text,
          })),
          correctAnswer: "",
        })),
      };

      setQuizData(mappedQuiz);
      setIsLoading(false);
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (quizResult) {
    return <QuizResultContent result={quizResult} onRetry={handleRetry} />;
  }

  if (!quizData) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Không thể tải bài quiz
      </div>
    );
  }

  return <QuizLessonContent quiz={quizData} onSubmit={handleQuizSubmit} />;
}

// ─── Exercise Wrapper Component ─────────────────────────────────────────────

function ExerciseLessonWrapper({
  exerciseId,
  lessonId,
  courseSlug,
  onComplete,
}: {
  exerciseId: string;
  lessonId: string;
  courseSlug: string;
  onComplete?: () => void;
}) {
  const { data, isLoading, error } = useExercise(exerciseId);
  const submitExercise = useSubmitExercise();
  const updateProgress = useUpdateProgress(courseSlug);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Không thể tải bài tập
      </div>
    );
  }

  const { exercise, testCases } = data;

  const exerciseData: ExerciseData = {
    id: exercise.id,
    title: exercise.title,
    difficulty: (exercise.difficulty as "easy" | "medium" | "hard") ?? "medium",
    description: exercise.description ?? "",
    examples: [],
    constraints: [],
    testCases: testCases
      .filter((tc) => !tc.is_hidden)
      .map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expected_output,
      })),
    starterCode: exercise.starter_code ?? "",
    supportedLanguages: (exercise.language ?? ["go"]).map((lang) => ({
      id: lang,
      name: lang.charAt(0).toUpperCase() + lang.slice(1),
      version: "",
    })),
  };

  const handleRun = async (code: string, language: string) => {
    return testCases.map((tc) => ({
      caseId: tc.id,
      passed: Math.random() > 0.3,
      input: tc.input,
      output: tc.expected_output,
      expected: tc.expected_output,
    }));
  };

  const handleSubmit = async (code: string, language: string) => {
    const result = await submitExercise.mutateAsync({
      exerciseId,
      code,
      language,
    });

    if (result.status === "accepted") {
      updateProgress.mutate({
        lessonId,
        status: "completed",
      });
      onComplete?.();
    }

    return {
      status: result.status as "accepted" | "wrong_answer",
      runtime: 0,
      testResults: testCases.map((tc) => ({
        caseId: tc.id,
        passed: result.status === "accepted",
        input: tc.input,
        output: tc.expected_output,
        expected: tc.expected_output,
      })),
    };
  };

  return (
    <ExerciseLessonContent
      exercise={exerciseData}
      onRun={handleRun}
      onSubmit={handleSubmit}
    />
  );
}

// ─── Main Client Component ──────────────────────────────────────────────────

interface PlayerClientProps {
  courseSlug: string;
  initialCurriculum: PlayerCurriculum;
  initialLessonId?: string | null;
}

export function PlayerClient({
  courseSlug,
  initialCurriculum,
  initialLessonId,
}: PlayerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use initial data from server, with client-side state for current lesson
  const curriculum = initialCurriculum;
  const lessonIdParam = searchParams.get("lesson") || initialLessonId;

  // Track optimistic completions
  const completions = useLessonCompletions(courseSlug);

  const [currentLessonId, setCurrentLessonId] = useState<string | null>(() => {
    if (lessonIdParam) return lessonIdParam;
    return curriculum.sections[0]?.lessons[0]?.id ?? null;
  });

  // Update URL when lesson changes
  useEffect(() => {
    if (currentLessonId) {
      const url = new URL(window.location.href);
      url.searchParams.set("lesson", currentLessonId);
      window.history.replaceState({}, "", url.toString());
    }
  }, [currentLessonId]);

  // Convert curriculum with optimistic completion state
  const playerCourse = curriculumToPlayerCourse(curriculum, completions);

  const currentLesson = currentLessonId
    ? curriculum.sections
        .flatMap((s) => s.lessons)
        .find((l) => l.id === currentLessonId)
    : null;

  const handleLessonSelect = (lessonId: string) => {
    setCurrentLessonId(lessonId);
  };

  const handleLessonComplete = () => {
    const allLessons = curriculum.sections.flatMap((s) => s.lessons);
    const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
    if (currentIndex < allLessons.length - 1) {
      setCurrentLessonId(allLessons[currentIndex + 1].id);
    }
  };

  const renderContent = () => {
    if (!currentLesson) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Chọn bài học để bắt đầu
        </div>
      );
    }

    switch (currentLesson.type) {
      case "quiz":
        if (!currentLesson.quiz_id) {
          return (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Bài quiz không khả dụng
            </div>
          );
        }
        return (
          <QuizLessonWrapper
            key={`quiz-${currentLesson.quiz_id}`}
            quizId={currentLesson.quiz_id}
            lessonId={currentLesson.id}
            courseSlug={courseSlug}
            onComplete={handleLessonComplete}
          />
        );

      case "exercise":
        if (!currentLesson.exercise_id) {
          return (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Bài tập không khả dụng
            </div>
          );
        }
        return (
          <ExerciseLessonWrapper
            key={`exercise-${currentLesson.exercise_id}`}
            exerciseId={currentLesson.exercise_id}
            lessonId={currentLesson.id}
            courseSlug={courseSlug}
            onComplete={handleLessonComplete}
          />
        );

      case "video":
      default:
        return (
          <VideoLessonContent
            key={`video-${currentLesson.id}`}
            lesson={{
              id: currentLesson.id,
              title: currentLesson.title,
              videoUrl: currentLesson.video_url,
              description: currentLesson.description,
            }}
            course={playerCourse}
            courseSlug={courseSlug}
            onComplete={handleLessonComplete}
            onNextLesson={handleLessonComplete}
          />
        );
    }
  };

  return (
    <>
      {/* Header */}
      <PlayerHeader
        courseTitle={curriculum.course.title}
        courseSlug={courseSlug}
        exerciseCount={
          curriculum.sections
            .flatMap((s) => s.lessons)
            .filter((l) => l.type === "exercise" && !l.contents.some((c) => c.exercise_id)).length
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {renderContent()}

        {/* Sidebar */}
        <PlayerLessonSidebar
          chapters={playerCourse.chapters}
          currentLessonId={currentLessonId ?? ""}
          courseSlug={courseSlug}
          onSelectLesson={handleLessonSelect}
        />
      </div>

      {/* Floating buttons */}
      <FloatingButtons
        lessonContext={
          currentLesson
            ? {
                title: currentLesson.title,
                courseTitle: curriculum.course.title,
                type: currentLesson.type as "video" | "quiz" | "exercise",
              }
            : undefined
        }
      />
    </>
  );
}
