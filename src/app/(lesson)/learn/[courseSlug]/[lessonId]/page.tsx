"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Menu,
  X,
  FileText,
  BookOpen,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  VideoPlayer,
  LessonSidebar,
  LessonNotes,
  LessonNavigation,
  LessonProgress,
  QuizWidget,
  XPToast,
  type Note,
  type Quiz,
  type QuizAnswer,
} from "@/components/lesson";
import { Section, Lesson } from "@/types/course";

// Mock data - replace with actual API calls
const MOCK_COURSE = {
  slug: "react-fundamentals",
  title: "React Fundamentals",
  sections: [
    {
      id: "1",
      title: "Gioi thieu React",
      duration: 45,
      order: 1,
      lessons: [
        {
          id: "1",
          title: "React la gi?",
          duration: 10,
          type: "video" as const,
          completed: true,
          order: 1,
        },
        {
          id: "2",
          title: "Cai dat moi truong",
          duration: 15,
          type: "video" as const,
          completed: true,
          order: 2,
        },
        {
          id: "3",
          title: "Component dau tien",
          duration: 20,
          type: "video" as const,
          completed: false,
          order: 3,
        },
      ],
    },
    {
      id: "2",
      title: "JSX va Props",
      duration: 60,
      order: 2,
      lessons: [
        {
          id: "4",
          title: "JSX co ban",
          duration: 15,
          type: "video" as const,
          completed: false,
          order: 1,
        },
        {
          id: "5",
          title: "Props trong React",
          duration: 20,
          type: "video" as const,
          completed: false,
          order: 2,
        },
        {
          id: "6",
          title: "Kiem tra kien thuc",
          duration: 10,
          type: "quiz" as const,
          completed: false,
          order: 3,
        },
      ],
    },
  ] as Section[],
};

const MOCK_QUIZ: Quiz = {
  id: "quiz-1",
  title: "Kiem tra kien thuc JSX",
  questions: [
    {
      id: "q1",
      text: "JSX la gi?",
      options: [
        { id: "a", text: "Mot ngon ngu lap trinh moi" },
        { id: "b", text: "Cu phap mo rong cua JavaScript" },
        { id: "c", text: "Mot thu vien CSS" },
        { id: "d", text: "Mot database" },
      ],
      correctOptionId: "b",
      explanation:
        "JSX la cu phap mo rong cua JavaScript, cho phep viet HTML trong JavaScript.",
    },
    {
      id: "q2",
      text: "Lam the nao de truyen du lieu vao component?",
      options: [
        { id: "a", text: "Su dung state" },
        { id: "b", text: "Su dung props" },
        { id: "c", text: "Su dung context" },
        { id: "d", text: "Tat ca deu dung" },
      ],
      correctOptionId: "b",
      explanation:
        "Props la cach chinh de truyen du lieu tu component cha sang component con.",
    },
  ],
};

type TabType = "overview" | "notes" | "resources";

export default function LessonViewerPage() {
  const params = useParams();
  const router = useRouter();
  const courseSlug = params.courseSlug as string;
  const lessonId = params.lessonId as string;

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showXPToast, setShowXPToast] = useState(false);
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      content: "Ghi chu mau - JSX rat quan trong!",
      timestamp: 120,
      createdAt: new Date().toISOString(),
    },
  ]);

  // Find current lesson and navigation info
  const { currentLesson, prevLesson, nextLesson, allLessons } = useMemo(() => {
    const allLessons: Lesson[] = MOCK_COURSE.sections.flatMap((s) => s.lessons);
    const currentIndex = allLessons.findIndex(
      (l) => l.id.toString() === lessonId
    );
    const currentLesson = allLessons[currentIndex];
    const prevLesson =
      currentIndex > 0
        ? { id: allLessons[currentIndex - 1].id.toString(), title: allLessons[currentIndex - 1].title }
        : undefined;
    const nextLesson =
      currentIndex < allLessons.length - 1
        ? { id: allLessons[currentIndex + 1].id.toString(), title: allLessons[currentIndex + 1].title }
        : undefined;

    return { currentLesson, prevLesson, nextLesson, allLessons };
  }, [lessonId]);

  const completedLessons = allLessons.filter((l) => l.completed).length;

  const handleVideoProgress = useCallback((progress: number) => {
    setVideoProgress(progress);
    // TODO: Save progress to backend
    console.log("Saving progress:", progress);
  }, []);

  const handleVideoComplete = useCallback(() => {
    setShowXPToast(true);
    // TODO: Mark lesson as complete, award XP
    console.log("Lesson completed!");
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentVideoTime(time);
  }, []);

  const handleAddNote = useCallback(
    (noteData: Omit<Note, "id" | "createdAt">) => {
      const newNote: Note = {
        ...noteData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
      // TODO: Save to backend
    },
    []
  );

  const handleDeleteNote = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    // TODO: Delete from backend
  }, []);

  const handleQuizSubmit = useCallback(
    (answers: QuizAnswer[], score: number) => {
      console.log("Quiz submitted:", { answers, score });
      if (score >= 70) {
        setShowXPToast(true);
      }
    },
    []
  );

  const handleCompleteCourse = useCallback(() => {
    router.push(`/courses/${courseSlug}`);
  }, [router, courseSlug]);

  if (!currentLesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Khong tim thay bai hoc</p>
      </div>
    );
  }

  const isQuiz = currentLesson.type === "quiz";

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="h-14 border-b bg-background flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/courses/${courseSlug}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Quay lai khoa hoc</span>
          </Link>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <h1 className="font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
            {MOCK_COURSE.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <LessonProgress
            completedLessons={completedLessons}
            totalLessons={allLessons.length}
            currentLessonProgress={videoProgress}
            className="hidden md:flex"
          />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          >
            {showMobileSidebar ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 lg:p-6">
            {/* Video or Quiz */}
            {isQuiz ? (
              <QuizWidget
                quiz={MOCK_QUIZ}
                onSubmit={handleQuizSubmit}
                onComplete={() => {
                  if (nextLesson) {
                    router.push(`/learn/${courseSlug}/${nextLesson.id}`);
                  }
                }}
              />
            ) : (
              <VideoPlayer
                src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
                poster="/images/video-poster.jpg"
                onProgress={handleVideoProgress}
                onComplete={handleVideoComplete}
                onTimeUpdate={handleTimeUpdate}
                initialTime={0}
              />
            )}

            {/* Lesson info */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold">{currentLesson.title}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {currentLesson.duration} phut
              </p>
            </div>

            {/* Tabs */}
            {!isQuiz && (
              <>
                <div className="flex gap-6 border-b mt-6">
                  {[
                    { id: "overview", label: "Tong quan", icon: BookOpen },
                    { id: "notes", label: "Ghi chu", icon: StickyNote },
                    { id: "resources", label: "Tai lieu", icon: FileText },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={cn(
                        "flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === tab.id
                          ? "border-primary-500 text-primary-600"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="py-6">
                  {activeTab === "overview" && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p>
                        Trong bai hoc nay, ban se hoc ve {currentLesson.title}.
                        Day la mot phan quan trong trong viec hieu ve React va
                        cach xay dung ung dung web hien dai.
                      </p>
                      <h3>Noi dung chinh</h3>
                      <ul>
                        <li>Gioi thieu ve khai niem co ban</li>
                        <li>Vi du thuc te</li>
                        <li>Bai tap thuc hanh</li>
                      </ul>
                    </div>
                  )}

                  {activeTab === "notes" && (
                    <LessonNotes
                      lessonId={lessonId}
                      notes={notes}
                      currentVideoTime={currentVideoTime}
                      onAddNote={handleAddNote}
                      onDeleteNote={handleDeleteNote}
                      onSeekToTimestamp={(timestamp) => {
                        // TODO: Seek video to timestamp
                        console.log("Seek to:", timestamp);
                      }}
                    />
                  )}

                  {activeTab === "resources" && (
                    <div className="space-y-4">
                      <p className="text-muted-foreground text-sm">
                        Tai lieu bo sung cho bai hoc nay:
                      </p>
                      <div className="space-y-2">
                        <a
                          href="#"
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors"
                        >
                          <FileText className="h-5 w-5 text-primary-500" />
                          <div>
                            <p className="font-medium text-sm">
                              Slide bai giang
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF - 2.5 MB
                            </p>
                          </div>
                        </a>
                        <a
                          href="#"
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors"
                        >
                          <FileText className="h-5 w-5 text-primary-500" />
                          <div>
                            <p className="font-medium text-sm">Ma nguon</p>
                            <p className="text-xs text-muted-foreground">
                              ZIP - 1.2 MB
                            </p>
                          </div>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Navigation */}
            <LessonNavigation
              courseSlug={courseSlug}
              prevLesson={prevLesson}
              nextLesson={nextLesson}
              onCompleteCourse={handleCompleteCourse}
            />
          </div>
        </div>

        {/* Sidebar - Desktop */}
        <LessonSidebar
          sections={MOCK_COURSE.sections}
          currentLessonId={lessonId}
          courseSlug={courseSlug}
          className="hidden lg:block"
        />

        {/* Sidebar - Mobile */}
        {showMobileSidebar && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowMobileSidebar(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-background shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">Noi dung khoa hoc</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileSidebar(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <LessonSidebar
                sections={MOCK_COURSE.sections}
                currentLessonId={lessonId}
                courseSlug={courseSlug}
                onSelectLesson={() => setShowMobileSidebar(false)}
                className="border-l-0"
              />
            </div>
          </div>
        )}
      </div>

      {/* XP Toast */}
      {showXPToast && (
        <XPToast
          xp={15}
          streakDay={3}
          onClose={() => setShowXPToast(false)}
        />
      )}
    </div>
  );
}
