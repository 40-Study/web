"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Film,
  GripVertical,
  Loader2,
  Monitor,
  Pencil,
  Play,
  Plus,
  Radio,
  Settings,
  Trash2,
  Users,
  X,
  Code,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCourse, useUpdateCourse } from "@/hooks/queries/use-courses";
import { useSections, useCreateSection, useReorderSections, useDeleteSection } from "@/hooks/queries/use-sections";
import { useLessons, useCreateLesson, useReorderLessons, useDeleteLesson } from "@/hooks/queries/use-lessons";
import { useLessonContents, useCreateLessonContent, useDeleteLessonContent } from "@/hooks/queries/use-lesson-content";
import type { LessonContent, CreateContentDTO } from "@/services/lesson-content.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Section } from "@/types/section";
import type { Lesson } from "@/types/lesson";
import { AddContentModal, type ContentData } from "@/components/teacher/add-content-modal";
import { useCreateLiveSession } from "@/hooks/queries/use-live-sessions";

// ─── Content type config ────────────────────────────────────────────────────

const CONTENT_TYPES = [
  {
    type: "video",
    label: "Video bài giảng",
    desc: "Upload hoặc dán link video",
    icon: Play,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    type: "livestream",
    label: "Buổi học trực tiếp",
    desc: "Lên lịch livestream",
    icon: Radio,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
  {
    type: "exercise",
    label: "Bài tập code",
    desc: "Thực hành lập trình",
    icon: Code,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
];

function getContentConfig(type: string) {
  return CONTENT_TYPES.find((c) => c.type === type) ?? CONTENT_TYPES[0];
}

// ─── Sortable Section ───────────────────────────────────────────────────────

function SortableSectionCard({
  section,
  courseId,
  onAddLesson,
  onDeleteSection,
  onOpenAddModal,
  onEditContent,
  onViewVideo,
}: {
  section: Section;
  courseId: string;
  onAddLesson: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onOpenAddModal?: (lessonId: string) => void;
  onEditContent?: (content: LessonContent) => void;
  onViewVideo?: (content: LessonContent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const { data: lessons = [], isLoading } = useLessons(courseId, section.id);
  const reorderLessons = useReorderLessons(courseId, section.id);
  const deleteLesson = useDeleteLesson(courseId, section.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lessons.findIndex((l) => l.id === active.id);
    const newIndex = lessons.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(lessons, oldIndex, newIndex);
    reorderLessons.mutate(reordered.map((l, i) => ({ id: l.id, display_order: i })));
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
      <Card>
        <CardContent className="p-0">
          {/* Section header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50/80">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-400 hover:text-gray-600">
              <GripVertical className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">{section.title}</h3>
              {section.description && (
                <p className="text-xs text-muted-foreground truncate">{section.description}</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{lessons.length} bài</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-red-500"
              onClick={() => onDeleteSection(section.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Lessons list */}
          <div className="px-4 py-2">
            {isLoading ? (
              <div className="flex items-center gap-2 py-4 justify-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
              </div>
            ) : lessons.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Chưa có bài học. Nhấn nút bên dưới để thêm.
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
                <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {lessons.map((lesson, idx) => (
                      <SortableLessonRow
                        key={lesson.id}
                        lesson={lesson}
                        index={idx}
                        courseId={courseId}
                        onDelete={() => deleteLesson.mutate(lesson.id)}
                        onOpenAddModal={onOpenAddModal}
                        onEditContent={onEditContent}
                        onViewVideo={onViewVideo}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Add lesson button */}
          <div className="px-4 pb-3">
            <button
              onClick={() => onAddLesson(section.id)}
              className="w-full py-2 border border-dashed rounded-lg text-sm text-muted-foreground hover:text-primary-600 hover:border-primary-300 transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm bài học
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sortable Lesson Row (expandable — shows contents inside) ────────────────

function SortableLessonRow({
  lesson,
  index,
  courseId,
  onDelete,
  onOpenAddModal,
  onEditContent,
  onViewVideo,
}: {
  lesson: Lesson;
  index: number;
  courseId: string;
  onDelete: () => void;
  onOpenAddModal?: (lessonId: string) => void;
  onEditContent?: (content: LessonContent) => void;
  onViewVideo?: (content: LessonContent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [expanded, setExpanded] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
      {/* Lesson header row */}
      <div className="flex items-center gap-2 rounded-lg px-2 py-2 group hover:bg-gray-50 transition-colors">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setExpanded(!expanded)} className="p-0.5 text-gray-400 hover:text-gray-600">
          <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-90")} />
        </button>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex-1 min-w-0 text-left"
        >
          <p className="text-sm font-medium truncate">{lesson.title}</p>
          <p className="text-xs text-muted-foreground">
            {lesson.duration_minutes ? `${lesson.duration_minutes} phút` : "Bài học"}
            {lesson.is_mandatory === false && " · Tùy chọn"}
          </p>
        </button>
        {lesson.is_preview && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0">Preview</Badge>
        )}
        <button
          onClick={onDelete}
          className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded: show contents */}
      {expanded && (
        <LessonContentsPanel
          lessonId={lesson.id}
          onOpenAddModal={onOpenAddModal}
          onEditContent={onEditContent}
          onViewVideo={onViewVideo}
        />
      )}
    </div>
  );
}

// ─── Quiz icon helpers ──────────────────────────────────────────────────────

import { FileQuestion, FileCode2, FileText as DocIcon, Clock } from "lucide-react";

const QUIZ_TRIGGER_LABELS: Record<string, string> = {
  scheduled: "Trắc nghiệm",
  video_checkpoint: "Quiz tại timeline",
  ai_triggered: "AI Quiz",
  manual: "Quiz thủ công",
};

// ─── Lesson Contents Panel (inside expanded lesson) ─────────────────────────

function LessonContentsPanel({
  lessonId,
  onOpenAddModal,
  onEditContent,
  onViewVideo,
}: {
  lessonId: string;
  onOpenAddModal?: (lessonId: string) => void;
  onEditContent?: (content: LessonContent) => void;
  onViewVideo?: (content: LessonContent) => void;
}) {
  const { data: contentsRaw, isLoading } = useLessonContents(lessonId);
  const contents: LessonContent[] = Array.isArray(contentsRaw) ? contentsRaw : [];
  const deleteContent = useDeleteLessonContent(lessonId);

  return (
    <div className="ml-10 mr-2 mb-2 border-l-2 border-gray-100 pl-4">
      {isLoading ? (
        <div className="py-2 text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Tải nội dung...
        </div>
      ) : (
        <>
          {/* ── Existing contents ── */}
          {contents.length > 0 && (
            <div className="space-y-0.5 py-1">
              {contents.map((c) => {
                const cfg = getContentConfig(c.type);
                const Icon = cfg.icon;
                const handleViewContent = () => {
                  if (c.type === "video") {
                    // Open video in preview modal or new tab
                    if (c.video_url) {
                      // If it's a relative API URL, construct full URL
                      let fullUrl = c.video_url;
                      if (c.video_url.startsWith("/api/")) {
                        fullUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}${c.video_url}`;
                      }
                      // For YouTube/Vimeo URLs, open directly
                      if (c.video_url.includes("youtube") || c.video_url.includes("vimeo") || c.video_url.includes("http")) {
                        window.open(c.video_url, "_blank");
                      } else {
                        // For uploaded videos, open video preview
                        onViewVideo?.(c);
                      }
                    } else {
                      toast.info("Video chưa được upload hoặc đang xử lý");
                    }
                  } else if (c.type === "livestream") {
                    window.open(`/rooms/${c.id}`, "_blank");
                  } else if (c.type === "exercise" && c.exercise_id) {
                    window.open(`/exercises/${c.exercise_id}`, "_blank");
                  }
                };
                return (
                  <div key={c.id} className="flex items-center gap-2 py-1.5 group/content hover:bg-gray-50 rounded-lg px-1 -mx-1 transition-colors">
                    <div className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0", cfg.bg, cfg.color)}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <button
                      onClick={handleViewContent}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-xs font-medium truncate hover:text-primary-600">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {cfg.label}
                        {c.duration ? ` · ${Math.round(c.duration / 60)} phút` : ""}
                      </p>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover/content:opacity-100 transition-all">
                      {(c.type === "video" && c.video_url) && (
                        <button
                          onClick={handleViewContent}
                          className="p-0.5 text-gray-400 hover:text-primary-600"
                          title="Xem video"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => onEditContent?.(c)}
                        className="p-0.5 text-gray-400 hover:text-primary-600"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteContent.mutate(c.id)}
                        className="p-0.5 text-gray-300 hover:text-red-500"
                        title="Xóa"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {contents.length === 0 && (
            <p className="py-2 text-xs text-muted-foreground">Chưa có nội dung.</p>
          )}

          {/* ── Add button ── */}
          <button
            onClick={() => onOpenAddModal?.(lessonId)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] text-primary-600 hover:text-primary-700 font-medium transition-colors border border-dashed border-primary-200 rounded-lg hover:bg-primary-50"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm nội dung
          </button>
        </>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = params.id;

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: sectionsRaw = [], isLoading: sectionsLoading } = useSections(courseId);
  const sections = Array.isArray(sectionsRaw) ? sectionsRaw : [];
  const createSection = useCreateSection(courseId);
  const reorderSections = useReorderSections(courseId);
  const deleteSection = useDeleteSection(courseId);
  const updateCourse = useUpdateCourse();

  // Dialogs
  const [sectionDialog, setSectionDialog] = useState(false);
  const [lessonDialog, setLessonDialog] = useState<string | null>(null); // sectionId or null
  const [classDialog, setClassDialog] = useState(false);

  // Add content modal
  const [addContentModal, setAddContentModal] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [uploadStatus, setUploadStatus] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | undefined>(undefined);

  // Edit content modal
  const [editContentModal, setEditContentModal] = useState(false);
  const [editingContent, setEditingContent] = useState<LessonContent | null>(null);

  // Video preview modal
  const [videoPreviewModal, setVideoPreviewModal] = useState(false);
  const [previewingVideo, setPreviewingVideo] = useState<LessonContent | null>(null);

  // Live session mutation
  const createLiveSession = useCreateLiveSession();

  // Section form
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionDesc, setSectionDesc] = useState("");

  // Lesson form
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDesc, setLessonDesc] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
  const [lessonPreview, setLessonPreview] = useState(false);
  const [lessonMandatory, setLessonMandatory] = useState(true);

  // Sensors for section drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Create lesson hook (needs current sectionId)
  const createLessonMutation = useCreateLesson(courseId, lessonDialog ?? "");

  // Handlers
  const handleCreateSection = async () => {
    if (!sectionTitle.trim()) return;
    await createSection.mutateAsync({ title: sectionTitle.trim(), description: sectionDesc.trim() || undefined });
    setSectionTitle("");
    setSectionDesc("");
    setSectionDialog(false);
  };

  const handleCreateLesson = async () => {
    if (!lessonDialog || !lessonTitle.trim()) return;
    await createLessonMutation.mutateAsync({
      title: lessonTitle.trim(),
      description: lessonDesc.trim() || undefined,
      duration_minutes: lessonDuration ? parseInt(lessonDuration) : undefined,
      is_preview: lessonPreview,
      is_mandatory: lessonMandatory,
    });
    setLessonTitle("");
    setLessonDesc("");
    setLessonDuration("");
    setLessonPreview(false);
    setLessonMandatory(true);
    setLessonDialog(null);
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);
    reorderSections.mutate(reordered.map((s, i) => ({ id: s.id, display_order: i })));
  };

  const handleDeleteSection = (sectionId: string) => {
    if (confirm("Xóa chương này và tất cả bài học bên trong?")) {
      deleteSection.mutate(sectionId);
    }
  };

  const handlePublish = () => {
    updateCourse.mutate({ id: courseId, data: { status: "published" } });
  };

  // Open add content modal for specific lesson
  const openAddContentModal = (lessonId: string) => {
    setCurrentLessonId(lessonId);
    setUploadedVideoUrl(undefined);
    setUploadProgress(undefined);
    setUploadStatus(undefined);
    setAddContentModal(true);
  };

  // Handle video file selection - start upload immediately
  const handleVideoFileSelect = async (file: File) => {
    if (!currentLessonId) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Đang khởi tạo upload...");

    try {
      const { videoUploadService } = await import("@/services/video-upload.service");

      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      setUploadStatus("Đang kết nối server...");
      const uploadInit = await videoUploadService.initUpload({
        resource_id: currentLessonId,
        resource_type: "lesson_content",
        original_file_name: file.name,
        content_type: file.type,
        file_size: file.size,
        chunk_size: CHUNK_SIZE,
      });

      // Upload chunks with progress tracking
      for (let chunkNum = 0; chunkNum < totalChunks; chunkNum++) {
        const start = chunkNum * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const progress = Math.round(((chunkNum + 0.5) / totalChunks) * 100);
        setUploadProgress(progress);
        setUploadStatus(`Đang upload phần ${chunkNum + 1}/${totalChunks}...`);

        const presignedUrls = await videoUploadService.getPresignedUrls({
          upload_id: uploadInit.upload_id,
          chunk_numbers: [chunkNum + 1],
        });

        const presignedUrl = presignedUrls[0];
        if (!presignedUrl?.url) {
          console.error("Invalid presigned URL:", presignedUrls);
          throw new Error("Không lấy được presigned URL");
        }

        console.log(`Uploading chunk ${chunkNum + 1} to:`, presignedUrl.url);

        try {
          const response = await fetch(presignedUrl.url, {
            method: "PUT",
            body: chunk,
          });

          if (!response.ok) {
            console.error("Upload chunk failed:", response.status, response.statusText);
            throw new Error(`Upload chunk thất bại: ${response.status}`);
          }

          const etag = response.headers.get("ETag") || `"chunk-${chunkNum + 1}"`;
          console.log(`Chunk ${chunkNum + 1} uploaded, ETag:`, etag);

          await videoUploadService.chunkComplete({
            upload_id: uploadInit.upload_id,
            chunk_number: chunkNum + 1,
            etag,
            size: chunk.size,
          });
        } catch (fetchErr) {
          console.error("Fetch error:", fetchErr);
          throw fetchErr;
        }

        setUploadProgress(Math.round(((chunkNum + 1) / totalChunks) * 100));
      }

      setUploadStatus("Đang hoàn tất...");
      await videoUploadService.completeUpload(uploadInit.upload_id);

      // Store the HLS URL
      const videoUrl = `/api/hls/${uploadInit.upload_id}/master.m3u8`;
      setUploadedVideoUrl(videoUrl);
      setUploadProgress(100);
      setUploadStatus("Upload thành công!");
      toast.success("Upload video thành công!");
    } catch (err: any) {
      console.error("Upload error:", err);
      const errorMsg = err?.message || "Upload video thất bại";
      toast.error(errorMsg);
      setUploadProgress(undefined);
      setUploadStatus(`Lỗi: ${errorMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle content creation from modal
  const handleAddContent = async (data: ContentData) => {
    try {
      const { lessonContentService } = await import("@/services/lesson-content.service");

      if (data.type === "video") {
        // Video URL is already set (either from upload or manual URL input)
        const videoUrl = data.videoUrl || "";

        if (!videoUrl) {
          toast.error("Vui lòng upload video hoặc nhập URL");
          return;
        }

        await lessonContentService.createContent(currentLessonId || "", {
          type: "video",
          title: data.title,
          video_url: videoUrl,
          is_mandatory: true,
        });
        // Handle quiz questions if any
        if (data.quizQuestions.length > 0) {
          const { quizService } = await import("@/services/quiz.service");
          const quiz = await quizService.create({
            lesson_id: currentLessonId || "",
            title: `Quiz - ${data.title}`,
            time_limit_minutes: 5,
            pass_percentage: 70,
            trigger_type: "scheduled",
            max_attempts: 3,
          });
          for (let i = 0; i < data.quizQuestions.length; i++) {
            const q = data.quizQuestions[i];
            await quizService.createQuestion(quiz.id, {
              question_text: q.question,
              question_type: "multiple_choice",
              points: 10,
              display_order: i,
              answers: q.options.map((o, idx) => ({
                answer_text: o.text,
                is_correct: o.id === q.correctId,
                display_order: idx,
              })),
            });
          }
        }
        toast.success("Đã thêm video");
      } else if (data.type === "livestream") {
        await createLiveSession.mutateAsync({
          course_id: courseId,
          lesson_id: currentLessonId || undefined,
          title: data.title,
          description: data.description,
          scheduled_date: data.date,
          start_time: data.startTime,
          duration_minutes: data.duration,
          platform: data.platform,
          custom_link: data.customLink,
          enable_reminder: data.enableReminder,
          enable_recording: data.enableRecording,
        });
        toast.success("Đã tạo buổi live");
      } else if (data.type === "exercise") {
        if (data.exerciseType === "quiz" && data.quizQuestions) {
          const { quizService } = await import("@/services/quiz.service");
          const quiz = await quizService.create({
            lesson_id: currentLessonId || "",
            title: data.title,
            time_limit_minutes: Math.floor((data.timeLimit || 300) / 60),
            pass_percentage: 70,
            trigger_type: "scheduled",
            max_attempts: 3,
          });
          for (let i = 0; i < data.quizQuestions.length; i++) {
            const q = data.quizQuestions[i];
            await quizService.createQuestion(quiz.id, {
              question_text: q.question,
              question_type: "multiple_choice",
              points: 10,
              display_order: i,
              answers: q.options.map((o, idx) => ({
                answer_text: o.text,
                is_correct: o.id === q.correctId,
                display_order: idx,
              })),
            });
          }
          toast.success("Đã tạo bài trắc nghiệm");
        } else if (data.exerciseType === "code") {
          // Create exercise first, then link to lesson content
          const { exerciseService } = await import("@/services/exercise.service");
          const exercise = await exerciseService.create({
            title: data.title,
            description: data.description,
            difficulty: "medium",
            language: ["javascript", "python"],
          });
          await lessonContentService.createContent(currentLessonId || "", {
            type: "exercise",
            title: data.title,
            exercise_id: exercise.id,
            is_mandatory: true,
          });
          toast.success("Đã tạo bài tập code");
        } else {
          // Essay exercise - create exercise first
          const { exerciseService } = await import("@/services/exercise.service");
          const exercise = await exerciseService.create({
            title: data.title,
            description: data.description,
          });
          await lessonContentService.createContent(currentLessonId || "", {
            type: "exercise",
            title: data.title,
            exercise_id: exercise.id,
            is_mandatory: true,
          });
          toast.success("Đã tạo bài tự luận");
        }
      }

      setAddContentModal(false);
      setCurrentLessonId(null);
    } catch (err) {
      toast.error("Không thể thêm nội dung");
    }
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/teacher/courses">
          <Button variant="ghost" size="icon" className="mt-0.5">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">{course.title}</h1>
            <Badge variant={isPublished ? "default" : "secondary"} className={isPublished ? "bg-green-100 text-green-700 border-green-200" : ""}>
              {isPublished ? "Đang xuất bản" : "Bản nháp"}
            </Badge>
          </div>
          {course.short_description && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{course.short_description}</p>
          )}
        </div>

        {/* Course thumbnail */}
        {course.thumbnail_url && (
          <div className="hidden sm:block w-20 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
            <Image src={course.thumbnail_url} alt="" width={80} height={48} className="object-cover w-full h-full" />
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex gap-2 flex-wrap">
        {!isPublished && (
          <Button size="sm" onClick={handlePublish} disabled={updateCourse.isPending}>
            Xuất bản
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setClassDialog(true)}>
          <Users className="w-4 h-4 mr-1" /> Quản lý lớp
        </Button>
        <Button variant="outline" size="sm" onClick={() => router.push(`/teacher/courses/${courseId}/members`)}>
          <Eye className="w-4 h-4 mr-1" /> Thành viên
        </Button>
      </div>

      {/* Sections & Lessons */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-3">Khóa học chưa có chương nào</p>
            <Button onClick={() => setSectionDialog(true)}>
              <Plus className="w-4 h-4 mr-1" /> Thêm chương đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sections.map((section) => (
                <SortableSectionCard
                  key={section.id}
                  section={section}
                  courseId={courseId}
                  onAddLesson={(sectionId) => {
                    setLessonDialog(sectionId);
                    setLessonTitle("");
                    setLessonDesc("");
                    setLessonDuration("");
                    setLessonPreview(false);
                    setLessonMandatory(true);
                  }}
                  onDeleteSection={handleDeleteSection}
                  onOpenAddModal={openAddContentModal}
                  onEditContent={(content) => {
                    setEditingContent(content);
                    setCurrentLessonId(content.lesson_id);
                    setEditContentModal(true);
                  }}
                  onViewVideo={(content) => {
                    setPreviewingVideo(content);
                    setVideoPreviewModal(true);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add section — big button at bottom */}
      <button
        onClick={() => setSectionDialog(true)}
        className="w-full py-4 border-2 border-dashed rounded-xl text-muted-foreground hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50/30 transition-all flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Plus className="w-5 h-5" /> Thêm chương mới
      </button>

      {/* ═══ Create Section Dialog ═══ */}
      <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm chương mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Tên chương *</Label>
              <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="VD: Giới thiệu & Cài đặt" />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Textarea rows={2} value={sectionDesc} onChange={(e) => setSectionDesc(e.target.value)} placeholder="Mô tả ngắn về nội dung chương..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialog(false)}>Hủy</Button>
            <Button onClick={handleCreateSection} disabled={!sectionTitle.trim() || createSection.isPending}>
              {createSection.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Tạo chương
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Create Lesson Dialog ═══ */}
      <Dialog open={!!lessonDialog} onOpenChange={(open) => !open && setLessonDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm bài học mới</DialogTitle>
            <DialogDescription>
              Tạo bài học trước, sau đó thêm nội dung (video, livestream, bài tập) trong trang chi tiết.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên bài học *</Label>
              <Input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="VD: Cú pháp cơ bản" />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Textarea rows={2} value={lessonDesc} onChange={(e) => setLessonDesc(e.target.value)} placeholder="Nội dung bài học..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Thời lượng (phút)</Label>
                <Input type="number" value={lessonDuration} onChange={(e) => setLessonDuration(e.target.value)} placeholder="15" />
              </div>
              <div className="space-y-3 pt-6">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Cho xem trước</Label>
                  <Switch checked={lessonPreview} onCheckedChange={setLessonPreview} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Bắt buộc</Label>
                  <Switch checked={lessonMandatory} onCheckedChange={setLessonMandatory} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialog(null)}>Hủy</Button>
            <Button onClick={handleCreateLesson} disabled={!lessonTitle.trim() || createLessonMutation.isPending}>
              {createLessonMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Tạo bài học
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Class Management Dialog ═══ */}
      <ClassManagementDialog courseId={courseId} open={classDialog} onOpenChange={setClassDialog} />

      {/* ═══ Add Content Modal ═══ */}
      <AddContentModal
        open={addContentModal}
        onOpenChange={setAddContentModal}
        onSubmit={handleAddContent}
        lessonId={currentLessonId || ""}
        isLoading={isUploading}
        uploadProgress={uploadProgress}
        uploadStatus={uploadStatus}
        onVideoFileSelect={handleVideoFileSelect}
        uploadedVideoUrl={uploadedVideoUrl}
      />

      {/* ═══ Edit Content Modal ═══ */}
      <EditContentModal
        open={editContentModal}
        onOpenChange={setEditContentModal}
        content={editingContent}
        lessonId={currentLessonId || ""}
        onSuccess={() => {
          setEditContentModal(false);
          setEditingContent(null);
        }}
      />

      {/* ═══ Video Preview Modal ═══ */}
      <VideoPreviewModal
        open={videoPreviewModal}
        onOpenChange={setVideoPreviewModal}
        content={previewingVideo}
      />
    </div>
  );
}

// ─── Class Management Dialog ────────────────────────────────────────────────

function ClassManagementDialog({
  courseId,
  open,
  onOpenChange,
}: {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [classes, setClasses] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    max_students?: number;
    student_count?: number;
    status?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch classes when dialog opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      import("@/services/class.service").then(({ classService }) => {
        classService.list(courseId)
          .then((data) => {
            setClasses(data || []);
            setShowCreateForm(data?.length === 0);
          })
          .catch(() => setClasses([]))
          .finally(() => setLoading(false));
      });
    }
  }, [open, courseId]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const { classService } = await import("@/services/class.service");
      const newClass = await classService.create(courseId, {
        name: name.trim(),
        description: desc.trim() || undefined,
        max_students: maxStudents ? parseInt(maxStudents) : undefined,
      });
      toast.success("Đã tạo lớp học");
      setClasses((prev) => [...prev, newClass]);
      setName("");
      setDesc("");
      setMaxStudents("");
      setShowCreateForm(false);
    } catch {
      toast.error("Không thể tạo lớp học");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (classId: string) => {
    if (!confirm("Bạn có chắc muốn xóa lớp này?")) return;
    setDeleting(classId);
    try {
      const { classService } = await import("@/services/class.service");
      await classService.delete(courseId, classId);
      toast.success("Đã xóa lớp học");
      setClasses((prev) => prev.filter((c) => c.id !== classId));
    } catch {
      toast.error("Không thể xóa lớp học");
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setName("");
    setDesc("");
    setMaxStudents("");
    setShowCreateForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quản lý lớp học</DialogTitle>
          <DialogDescription>
            {classes.length > 0
              ? `Có ${classes.length} lớp trong khóa học này`
              : "Chưa có lớp nào. Tạo lớp để quản lý học viên."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : showCreateForm ? (
          /* ── Create Form ── */
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Tên lớp *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Lớp A - K67" />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả về lớp học..." />
            </div>
            <div className="space-y-1.5">
              <Label>Số học viên tối đa</Label>
              <Input type="number" value={maxStudents} onChange={(e) => setMaxStudents(e.target.value)} placeholder="30" className="w-32" />
            </div>
            <div className="flex gap-2 pt-2">
              {classes.length > 0 && (
                <Button variant="outline" onClick={resetForm}>Hủy</Button>
              )}
              <Button onClick={handleCreate} disabled={!name.trim() || creating} className="flex-1">
                {creating && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                Tạo lớp
              </Button>
            </div>
          </div>
        ) : (
          /* ── Class List ── */
          <div className="space-y-3">
            {classes.map((cls) => (
              <div key={cls.id} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                  {cls.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{cls.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cls.student_count ?? 0} học viên
                    {cls.max_students && ` / ${cls.max_students}`}
                    {cls.status && ` · ${cls.status}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(cls.id)}
                  disabled={deleting === cls.id}
                >
                  {deleting === cls.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}

            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-3 border-2 border-dashed rounded-xl text-muted-foreground hover:text-primary-600 hover:border-primary-300 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Thêm lớp mới
            </button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Video Preview Modal ────────────────────────────────────────────────────

function VideoPreviewModal({
  open,
  onOpenChange,
  content,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: LessonContent | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  // Construct full video URL
  const videoUrl = useMemo(() => {
    if (!content?.video_url) return "";
    const url = content.video_url;
    // Normalize legacy absolute API URLs to same-origin for stable cookies/CORS.
    if (/^https?:\/\/localhost:5000\/api\//i.test(url)) {
      return url.replace(/^https?:\/\/localhost:5000\/api/i, "/api");
    }
    if (/^https?:\/\/api\.fortex\.ai\.vn\/api\//i.test(url)) {
      return url.replace(/^https?:\/\/api\.fortex\.ai\.vn\/api/i, "/api");
    }
    return url;
  }, [content?.video_url]);

  const isHls = videoUrl.includes(".m3u8");

  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !videoUrl || !videoRef.current) return;

    setVideoError(null);
    const video = videoRef.current;

    if (isHls) {
      // Use hls.js for HLS streams
      import("hls.js").then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls({
            maxBufferLength: 30,        // Max 30 giây buffer
            maxMaxBufferLength: 60,     // Max 60 giây total
            maxBufferSize: 10 * 1000 * 1000, // 10MB max buffer (giảm bandwidth)
            startLevel: 0,              // Bắt đầu với quality thấp nhất
            abrMaxWithRealBitrate: true, // Sử dụng bitrate thực
            abrBandWidthFactor: 0.7,    // Conservative bandwidth estimate
          });
          hlsRef.current = hls;
          hls.loadSource(videoUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              console.error("HLS Error:", data);
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                setVideoError("Không thể tải video. Video có thể đang được xử lý.");
              } else {
                setVideoError("Lỗi phát video: " + data.details);
              }
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari native HLS support
          video.src = videoUrl;
          video.play().catch(() => {});
        }
      });
    } else {
      // Regular video
      video.src = videoUrl;
      video.onerror = () => setVideoError("Không thể tải video");
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [open, videoUrl, isHls]);

  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>Xem trước video bài giảng</DialogDescription>
        </DialogHeader>

        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {videoUrl ? (
            <>
              <video
                ref={videoRef}
                controls
                className="w-full h-full"
              >
                Trình duyệt không hỗ trợ video.
              </video>
              {videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-center p-4">
                  <div>
                    <p className="text-red-400 mb-2">{videoError}</p>
                    <p className="text-sm text-gray-400">URL: {videoUrl}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <p>Video chưa được upload hoặc đang xử lý</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          {videoUrl && (
            <Button onClick={() => window.open(videoUrl, "_blank")}>
              <Eye className="w-4 h-4 mr-2" />
              Mở trong tab mới
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Content Modal ─────────────────────────────────────────────────────

function EditContentModal({
  open,
  onOpenChange,
  content,
  lessonId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: LessonContent | null;
  lessonId: string;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Sync state when content changes
  useEffect(() => {
    if (content) {
      setTitle(content.title);
      setVideoUrl(content.video_url || "");
    }
  }, [content]);

  const handleSave = async () => {
    if (!content || !title.trim()) return;
    setIsSaving(true);
    try {
      const { lessonContentService } = await import("@/services/lesson-content.service");
      await lessonContentService.updateContent(lessonId, content.id, {
        title: title.trim(),
      });
      // Invalidate lesson contents query
      queryClient.invalidateQueries({ queryKey: ["lesson-contents", lessonId] });
      toast.success("Đã cập nhật nội dung");
      onSuccess();
    } catch {
      toast.error("Không thể cập nhật nội dung");
    } finally {
      setIsSaving(false);
    }
  };

  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa nội dung</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin {content.type === "video" ? "video" : content.type === "livestream" ? "buổi live" : "bài tập"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Tiêu đề</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề..."
            />
          </div>

          {content.type === "video" && (
            <div className="space-y-2">
              <Label htmlFor="edit-video-url">URL Video</Label>
              <Input
                id="edit-video-url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
                disabled
              />
              <p className="text-xs text-muted-foreground">
                URL video không thể thay đổi. Để đổi video, vui lòng xóa và tạo mới.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave} disabled={!title.trim() || isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
