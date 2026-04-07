"use client";

import { useState } from "react";
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
  Loader2,
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
import { useMyStudents } from "@/hooks/queries/use-classes";
import { useCourse } from "@/hooks/queries/use-courses";
import { useSections, useCreateSection } from "@/hooks/queries/use-sections";
import { useLessons, useCreateLesson } from "@/hooks/queries/use-lessons";
import type { Section } from "@/types/section";
import type { Lesson } from "@/types/lesson";
import type { LessonType } from "../course-detail-data";

// ─── Icon mapping ─────────────────────────────────────────────────────────────

const LESSON_ICONS: Record<string, { icon: JSX.Element; bg: string; color: string }> = {
  video: { icon: <Play className="h-4 w-4" />, bg: "bg-blue-100", color: "text-blue-600" },
  quiz: { icon: <HelpCircle className="h-4 w-4" />, bg: "bg-green-100", color: "text-green-600" },
  article: { icon: <FileText className="h-4 w-4" />, bg: "bg-red-100", color: "text-red-600" },
  sandbox: { icon: <Code className="h-4 w-4" />, bg: "bg-orange-100", color: "text-orange-600" },
  document: { icon: <FileText className="h-4 w-4" />, bg: "bg-red-100", color: "text-red-600" },
};

const LESSON_LABELS: Record<string, string> = {
  video: "Video bài giảng",
  quiz: "Quiz",
  article: "Bài viết",
  sandbox: "Sandbox IDE Practice",
  document: "PDF Document",
};

function getLessonIcon(type: string) {
  return LESSON_ICONS[type] ?? LESSON_ICONS.article;
}

// ─── Sub-component: section with its lessons ─────────────────────────────────

function SectionCard({
  section,
  courseId,
  onAddLesson,
}: {
  section: Section;
  courseId: string;
  onAddLesson: (sectionId: string) => void;
}) {
  const router = useRouter();
  const { data: lessons = [], isLoading } = useLessons(courseId, section.id);

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <GripVertical className="mt-0.5 h-5 w-5 cursor-move text-muted-foreground" />
          <div className="flex-1">
            <h3 className="font-medium">{section.title}</h3>
            {section.description && (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            )}
          </div>
        </div>

        <div className="ml-8 space-y-2">
          {isLoading ? (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải bài học...
            </div>
          ) : lessons.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              Chưa có bài học nào trong chương này.
            </p>
          ) : (
            lessons.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} courseId={courseId} router={router} />)
          )}
        </div>

        <Button
          variant="ghost"
          className="mt-2 w-full border border-dashed text-muted-foreground"
          onClick={() => onAddLesson(section.id)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm bài học mới
        </Button>
      </CardContent>
    </Card>
  );
}

function LessonRow({
  lesson,
  courseId,
  router,
}: {
  lesson: Lesson;
  courseId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const icon = getLessonIcon(lesson.type ?? "article");
  return (
    <div className="space-y-2">
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
            {LESSON_LABELS[lesson.type ?? "article"] ?? lesson.type}
            {lesson.duration && ` • ${lesson.duration}s`}
          </p>
        </div>
        <Badge variant={lesson.is_preview ? "success" : "secondary"}>
          {lesson.is_preview ? "Preview" : "Draft"}
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
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = params.id;

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: sections = [], isLoading: sectionsLoading } = useSections(courseId);
  const createSection = useCreateSection(courseId);

  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);

  // Section form state
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterDescription, setChapterDescription] = useState("");

  // Lesson form state
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<LessonType>("video");
  const [lessonSummary, setLessonSummary] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");

  const { data: allStudents = [] } = useMyStudents();
  const courseMembers = allStudents.filter((s) => s.course_id === courseId);

  const openLessonDialog = (sectionId: string) => {
    setTargetSectionId(sectionId);
    setLessonTitle("");
    setLessonType("video");
    setLessonSummary("");
    setLessonDuration("");
    setIsLessonDialogOpen(true);
  };

  const handleCreateSection = async () => {
    if (!chapterTitle.trim()) return;
    await createSection.mutateAsync({
      title: chapterTitle.trim(),
      description: chapterDescription.trim() || undefined,
    });
    setChapterTitle("");
    setChapterDescription("");
    setIsChapterDialogOpen(false);
  };

  const createLesson = useCreateLesson(courseId, targetSectionId ?? "");

  const handleCreateLesson = async () => {
    if (!targetSectionId || !lessonTitle.trim()) return;
    await createLesson.mutateAsync({
      title: lessonTitle.trim(),
      description: lessonSummary.trim() || undefined,
      duration_minutes:
        lessonType === "video" && lessonDuration.trim()
          ? Math.ceil((Number(lessonDuration) || 0) / 60) || undefined
          : undefined,
      is_preview: false,
    });
    setIsLessonDialogOpen(false);
  };

  if (courseLoading || sectionsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) return null;

  const isPublished = course.status === "published";

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
            <Badge className={isPublished ? "border-green-200 bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
              {isPublished ? "Đang xuất bản" : "Bản nháp"}
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

        {sections.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Khóa học chưa có chương nào. Nhấn &ldquo;Thêm chương&rdquo; để bắt đầu.
          </p>
        ) : (
          sections.map((section) => (
            <SectionCard key={section.id} section={section} courseId={courseId} onAddLesson={openLessonDialog} />
          ))
        )}
      </div>

      <TeacherNotificationDialog
        open={isNotifyDialogOpen}
        onOpenChange={setIsNotifyDialogOpen}
        recipients={courseMembers.map((member) => ({ id: member.id, name: member.name, phone: member.parent_phone }))}
        contextLabel={`Chi tiết khóa học: ${course.title}`}
      />

      {/* Add section dialog */}
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
              <Label htmlFor="chapter-description">Mô tả chương</Label>
              <Textarea
                id="chapter-description"
                rows={3}
                value={chapterDescription}
                onChange={(e) => setChapterDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChapterDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateSection}
              disabled={!chapterTitle.trim() || createSection.isPending}
            >
              {createSection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo chương
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add lesson dialog */}
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

            {lessonType === "video" && (
              <div className="space-y-2">
                <Label htmlFor="lesson-duration">Thời lượng (giây)</Label>
                <Input
                  id="lesson-duration"
                  type="number"
                  placeholder="VD: 750"
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="lesson-summary">Mô tả bài học</Label>
              <Textarea id="lesson-summary" rows={3} value={lessonSummary} onChange={(e) => setLessonSummary(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateLesson}
              disabled={!lessonTitle.trim() || createLesson.isPending}
            >
              {createLesson.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo bài học
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
