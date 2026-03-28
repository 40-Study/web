"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  Code,
  Eye,
  FileText,
  GripVertical,
  HelpCircle,
  Play,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import TeacherNotificationDialog from "@/components/teacher/teacher-notification-dialog";
import { cn } from "@/lib/utils";
import { getStudentsByCourseId } from "../../students/student-mock-data";
import {
  getTeacherCourseDetail,
  LessonType,
  loadTeacherCourseChapters,
  saveTeacherCourseChapters,
  TeacherCourseChapter,
  TeacherCourseLesson,
} from "../course-detail-data";

const LESSON_ICONS: Record<LessonType, { icon: JSX.Element; bg: string; color: string }> = {
  video: { icon: <Play className="h-4 w-4" />, bg: "bg-blue-100", color: "text-blue-600" },
  quiz: { icon: <HelpCircle className="h-4 w-4" />, bg: "bg-green-100", color: "text-green-600" },
  sandbox: { icon: <Code className="h-4 w-4" />, bg: "bg-orange-100", color: "text-orange-600" },
  document: { icon: <FileText className="h-4 w-4" />, bg: "bg-red-100", color: "text-red-600" },
};

const LESSON_LABELS: Record<LessonType, string> = {
  video: "Video bài giảng",
  quiz: "Quiz",
  sandbox: "Sandbox IDE Practice",
  document: "PDF Document",
};

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = params.id;
  const course = useMemo(() => getTeacherCourseDetail(courseId), [courseId]);

  const [chapters, setChapters] = useState<TeacherCourseChapter[]>(course.chapters);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState<string | null>(null);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);

  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterDescription, setChapterDescription] = useState("");
  const [chapterGoal, setChapterGoal] = useState("");

  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<LessonType>("video");
  const [lessonSummary, setLessonSummary] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonStatus, setLessonStatus] = useState<"published" | "draft">("draft");
  const [lessonDuration, setLessonDuration] = useState("");
  const [lessonQuestionCount, setLessonQuestionCount] = useState("");
  const [lessonFileSize, setLessonFileSize] = useState("");

  const courseMembers = getStudentsByCourseId(courseId);

  useEffect(() => {
    setChapters(loadTeacherCourseChapters(courseId));
    setIsHydrated(true);
  }, [courseId]);

  useEffect(() => {
    if (!isHydrated) return;
    saveTeacherCourseChapters(courseId, chapters);
  }, [chapters, courseId, isHydrated]);

  const openLessonDialog = (chapterId: string) => {
    setTargetChapterId(chapterId);
    setLessonTitle("");
    setLessonType("video");
    setLessonSummary("");
    setLessonContent("");
    setLessonStatus("draft");
    setLessonDuration("");
    setLessonQuestionCount("");
    setLessonFileSize("");
    setIsLessonDialogOpen(true);
  };

  const handleCreateChapter = () => {
    if (!chapterTitle.trim() || !chapterDescription.trim() || !chapterGoal.trim()) return;
    setChapters((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        title: chapterTitle.trim(),
        description: chapterDescription.trim(),
        learningGoal: chapterGoal.trim(),
        lessons: [],
      },
    ]);
    setChapterTitle("");
    setChapterDescription("");
    setChapterGoal("");
    setIsChapterDialogOpen(false);
  };

  const handleCreateLesson = () => {
    if (!targetChapterId || !lessonTitle.trim() || !lessonSummary.trim() || !lessonContent.trim()) return;

    const draftLesson: TeacherCourseLesson = {
      id: `l-${Date.now()}`,
      title: lessonTitle.trim(),
      type: lessonType,
      summary: lessonSummary.trim(),
      content: lessonContent.trim(),
      status: lessonStatus,
      duration: lessonType === "video" ? lessonDuration.trim() || undefined : undefined,
      questionCount:
        lessonType === "quiz" && lessonQuestionCount.trim()
          ? Number(lessonQuestionCount.trim()) || undefined
          : undefined,
      fileSize: lessonType === "document" ? lessonFileSize.trim() || undefined : undefined,
    };

    setChapters((prev) =>
      prev.map((chapter) =>
        chapter.id === targetChapterId ? { ...chapter, lessons: [...chapter.lessons, draftLesson] } : chapter
      )
    );

    setIsLessonDialogOpen(false);
  };

  if (!isHydrated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teacher/courses">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{course.title}</h1>
            <Badge className={course.status === "published" ? "border-green-200 bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
              {course.status === "published" ? "Đang xuất bản" : "Bản nháp"}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/teacher/courses/${courseId}/members`)}>
            <Eye className="mr-2 h-4 w-4" />
            Xem thành viên
          </Button>
          <Button variant="outline" onClick={() => setIsNotifyDialogOpen(true)} disabled={courseMembers.length === 0}>
            <Bell className="mr-2 h-4 w-4" />
            Gửi thông báo
          </Button>
          <Button onClick={() => setIsChapterDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm chương
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Chương trình học</h2>
          <p className="text-sm text-muted-foreground">Nhấn vào từng bài học để mở trang chi tiết và xem bình luận học viên.</p>
        </div>

        {chapters.map((chapter) => (
          <Card key={chapter.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start gap-3">
                <GripVertical className="mt-0.5 h-5 w-5 cursor-move text-muted-foreground" />
                <div className="flex-1">
                  <h3 className="font-medium">{chapter.title}</h3>
                  <p className="text-sm text-muted-foreground">{chapter.description}</p>
                  <p className="mt-1 text-xs text-primary-700">Mục tiêu: {chapter.learningGoal}</p>
                </div>
              </div>

              <div className="ml-8 space-y-2">
                {chapter.lessons.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    Chưa có bài học nào trong chương này.
                  </p>
                ) : (
                  chapter.lessons.map((lesson) => {
                    const icon = LESSON_ICONS[lesson.type];
                    return (
                      <div key={lesson.id} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/teacher/courses/${courseId}/lessons/${lesson.id}`)}
                          className="flex w-full items-center gap-3 rounded-lg bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100"
                        >
                          <GripVertical className="h-4 w-4 cursor-move text-muted-foreground" />
                          <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", icon.bg, icon.color)}>
                            {icon.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {LESSON_LABELS[lesson.type]}
                              {lesson.duration && ` • ${lesson.duration}`}
                              {lesson.questionCount && ` • ${lesson.questionCount} câu hỏi`}
                              {lesson.fileSize && ` • ${lesson.fileSize}`}
                            </p>
                          </div>
                          <Badge variant={lesson.status === "published" ? "success" : "secondary"}>
                            {lesson.status === "published" ? "Published" : "Draft"}
                          </Badge>
                        </button>
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/teacher/assignments?courseId=${courseId}&lessonId=${lesson.id}`}>
                              Giao bài tập
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <Button variant="ghost" className="mt-2 w-full border border-dashed text-muted-foreground" onClick={() => openLessonDialog(chapter.id)}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm bài học mới
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <TeacherNotificationDialog
        open={isNotifyDialogOpen}
        onOpenChange={setIsNotifyDialogOpen}
        recipients={courseMembers.map((member) => ({ id: member.id, name: member.name, phone: member.parentPhone }))}
        contextLabel={`Chi tiết khóa học: ${course.title}`}
      />

      <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Tạo chương mới</DialogTitle>
            <DialogDescription>Nhập đầy đủ thông tin chương trước khi thêm vào khóa học.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="chapter-title">Tên chương *</Label>
              <Input id="chapter-title" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chapter-description">Mô tả chương *</Label>
              <Textarea
                id="chapter-description"
                rows={3}
                value={chapterDescription}
                onChange={(e) => setChapterDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chapter-goal">Mục tiêu học tập *</Label>
              <Textarea id="chapter-goal" rows={2} value={chapterGoal} onChange={(e) => setChapterGoal(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChapterDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateChapter}
              disabled={!chapterTitle.trim() || !chapterDescription.trim() || !chapterGoal.trim()}
            >
              Tạo chương
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo bài học mới</DialogTitle>
            <DialogDescription>Điền nội dung chi tiết để học viên có thể học và thảo luận ngay tại bài học.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="lesson-title">Tên bài học *</Label>
              <Input id="lesson-title" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Loại bài học</Label>
              <Select value={lessonType} onValueChange={(value) => setLessonType(value as LessonType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={lessonStatus} onValueChange={(value) => setLessonStatus(value as "published" | "draft")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {lessonType === "video" && (
              <div className="space-y-2">
                <Label htmlFor="lesson-duration">Thời lượng</Label>
                <Input id="lesson-duration" placeholder="VD: 15:30" value={lessonDuration} onChange={(e) => setLessonDuration(e.target.value)} />
              </div>
            )}
            {lessonType === "quiz" && (
              <div className="space-y-2">
                <Label htmlFor="lesson-questions">Số câu hỏi</Label>
                <Input
                  id="lesson-questions"
                  type="number"
                  min={1}
                  placeholder="VD: 10"
                  value={lessonQuestionCount}
                  onChange={(e) => setLessonQuestionCount(e.target.value)}
                />
              </div>
            )}
            {lessonType === "document" && (
              <div className="space-y-2">
                <Label htmlFor="lesson-file-size">Dung lượng file</Label>
                <Input id="lesson-file-size" placeholder="VD: 2.1 MB" value={lessonFileSize} onChange={(e) => setLessonFileSize(e.target.value)} />
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="lesson-summary">Tóm tắt *</Label>
              <Textarea id="lesson-summary" rows={2} value={lessonSummary} onChange={(e) => setLessonSummary(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="lesson-content">Nội dung bài học *</Label>
              <Textarea id="lesson-content" rows={4} value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateLesson} disabled={!lessonTitle.trim() || !lessonSummary.trim() || !lessonContent.trim()}>
              Tạo bài học
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
