"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CheckCircle,
  Circle,
  Play,
  FileText,
  HelpCircle,
  Code,
  Lock,
  Radio,
  Loader2,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Section, Lesson } from "@/types/course";
import { useLessonContents } from "@/hooks/queries/use-lesson-content";
import { usePreviewLessonContents } from "@/hooks/queries/use-preview-lesson-contents";
import { useHlsSource } from "@/hooks/use-hls-source";
import { useLessonVideoSource } from "@/hooks/use-lesson-video-source";
import { pickVideoSource, VIDEO_PROCESSING_MESSAGE } from "@/lib/hls-playback";
import type { LessonContent } from "@/services/lesson-content.service";

interface CourseSyllabusProps {
  sections: Section[];
  isEnrolled?: boolean;
  courseSlug?: string;
  /** Show "Xem thử" links for free-preview lessons on paid courses */
  showTrialLinks?: boolean;
  className?: string;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} giờ`;
  return `${hours}h ${mins}p`;
}

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  return `${mins} phút`;
}

function getLessonIcon(type: Lesson["type"]) {
  switch (type) {
    case "video":
      return Play;
    case "quiz":
      return HelpCircle;
    case "reading":
      return FileText;
    case "exercise":
      return Code;
    default:
      return Circle;
  }
}

function getContentIcon(type: string) {
  switch (type) {
    case "video":
      return Play;
    case "livestream":
      return Radio;
    case "exercise":
      return Code;
    default:
      return Circle;
  }
}

function getContentTypeLabel(type: string) {
  switch (type) {
    case "video":
      return "Video";
    case "livestream":
      return "Buổi học trực tiếp";
    case "exercise":
      return "Bài tập";
    default:
      return "";
  }
}

function getLessonTypeLabel(type: Lesson["type"]) {
  switch (type) {
    case "video":
      return "Video";
    case "quiz":
      return "Kiểm tra";
    case "reading":
      return "Tài liệu";
    case "exercise":
      return "Bài tập";
    default:
      return "";
  }
}

// ─── Lesson Contents Panel ──────────────────────────────────────────────────

function LessonContentsPanel({
  lessonId,
  isEnrolled,
  isFreePreview,
  courseSlug,
  showTrialLinks,
  onViewVideo,
}: {
  lessonId: string;
  isEnrolled: boolean;
  isFreePreview: boolean;
  courseSlug?: string;
  showTrialLinks?: boolean;
  onViewVideo: (previewing: PreviewingVideo) => void;
}) {
  const canAccess = isEnrolled || isFreePreview;
  // F1 (QA vòng 2): bài xem thử của người CHƯA ghi danh (kể cả khách chưa đăng nhập) đi qua
  // endpoint công khai; người đã ghi danh dùng route đầy đủ như cũ. Bài khoá (không ghi danh,
  // không preview) không gọi API nào — trước đây vẫn gọi và nhận 401/403 rồi hiện nhầm "Chưa có
  // nội dung".
  const usePublicPreview = !isEnrolled && isFreePreview;
  const enrolledQuery = useLessonContents(isEnrolled ? lessonId : "");
  const previewQuery = usePreviewLessonContents(courseSlug, lessonId, usePublicPreview);
  const activeQuery = usePublicPreview ? previewQuery : enrolledQuery;
  const { data: contentsRaw, isLoading, isError } = activeQuery;
  const contents: LessonContent[] = Array.isArray(contentsRaw) ? contentsRaw : [];

  // URL video là URL KÝ ngắn hạn (S1): hết hạn thì player gọi lại đây để lấy URL mới (refetch cùng
  // endpoint đã kiểm quyền) — không bao giờ tự dựng URL.
  const makeViewing = (content: LessonContent): PreviewingVideo => ({
    content,
    refreshContent: async () => {
      const { data } = await activeQuery.refetch();
      return (Array.isArray(data) ? data : []).find((c) => c.id === content.id);
    },
  });

  if (!canAccess) {
    return (
      <div className="py-3 pl-16 pr-4 text-sm text-muted-foreground">
        Đăng ký khóa học để xem nội dung bài học này.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-3 pl-16 pr-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải nội dung...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-3 pl-16 pr-4 text-sm text-muted-foreground" role="alert">
        Không tải được nội dung bài học. Vui lòng thử lại sau.
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="py-3 pl-16 pr-4 text-sm text-muted-foreground">
        Chưa có nội dung trong bài học này.
      </div>
    );
  }

  return (
    <div className="bg-muted/20">
      {contents.map((content) => {
        const ContentIcon = getContentIcon(content.type);
        const handleClick = () => {
          if (!canAccess) return;
          if (content.type === "video" && (content.video_hls_url || content.video_url)) {
            onViewVideo(makeViewing(content));
          } else if (content.type === "exercise" && content.exercise_id) {
            window.open(`/exercises/${content.exercise_id}`, "_blank");
          }
        };

        return (
          <div
            key={content.id}
            onClick={handleClick}
            className={cn(
              "flex items-center justify-between border-t border-muted/50 py-2.5 pl-16 pr-4",
              canAccess && content.type === "video" && (content.video_hls_url || content.video_url) && "cursor-pointer hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-3">
              {canAccess ? (
                <ContentIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <div>
                <span className="text-sm">{content.title}</span>
                <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {getContentTypeLabel(content.type)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {content.duration && (
                <span className="text-xs text-muted-foreground">
                  {formatSeconds(content.duration)}
                </span>
              )}
              {canAccess && content.type === "video" && (content.video_hls_url || content.video_url) && showTrialLinks && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-primary-600 hover:text-primary-700 h-7 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewVideo(makeViewing(content));
                  }}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Xem thử
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Expandable Lesson Row ──────────────────────────────────────────────────

function ExpandableLessonRow({
  lesson,
  isEnrolled,
  courseSlug,
  showTrialLinks,
  onViewVideo,
}: {
  lesson: Lesson;
  isEnrolled: boolean;
  courseSlug?: string;
  showTrialLinks?: boolean;
  onViewVideo: (previewing: PreviewingVideo) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const LessonIcon = getLessonIcon(lesson.type);
  const canAccess = isEnrolled || lesson.isFreePreview;
  const lessonHref = `/learn/${courseSlug}/${lesson.id}`;

  return (
    <div>
      {/* Lesson Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center justify-between border-t border-muted py-3 pl-8 pr-4 cursor-pointer hover:bg-muted/50"
        )}
      >
        <div className="flex items-center gap-3">
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform text-muted-foreground",
              expanded && "rotate-90"
            )}
          />
          {isEnrolled ? (
            lesson.completed ? (
              <CheckCircle className="h-5 w-5 text-xp flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )
          ) : canAccess ? (
            <LessonIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          )}

          <div>
            <span className={cn(lesson.completed && "text-muted-foreground")}>
              {lesson.title}
            </span>
            {lesson.type !== "video" && (
              <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">
                {getLessonTypeLabel(lesson.type)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {formatDuration(lesson.duration)}
          </span>
          {canAccess && showTrialLinks && (
            <span className="text-sm text-primary-600">Xem thử</span>
          )}
        </div>
      </div>

      {/* Lesson Contents */}
      {expanded && (
        <LessonContentsPanel
          lessonId={lesson.id.toString()}
          isEnrolled={isEnrolled}
          isFreePreview={lesson.isFreePreview || false}
          courseSlug={courseSlug}
          showTrialLinks={showTrialLinks}
          onViewVideo={onViewVideo}
        />
      )}
    </div>
  );
}

// ─── Video Preview Modal ────────────────────────────────────────────────────

/** Nội dung đang xem thử + hàm lấy lại nội dung mới (URL ký mới) khi URL hiện tại hết hạn. */
interface PreviewingVideo {
  content: LessonContent;
  refreshContent: () => Promise<LessonContent | undefined>;
}

function VideoPreviewModal({
  open,
  onOpenChange,
  previewing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewing: PreviewingVideo | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const content = previewing?.content ?? null;

  // S1: video HLS chỉ phát được bằng URL KÝ do API cấp (`video_hls_url`); học viên/khách không còn
  // nhận file gốc, nên khi HLS chưa xong chỉ có thể báo "đang xử lý".
  const { source, src, isChecking } = useLessonVideoSource(content, open);

  const refreshContent = previewing?.refreshContent;
  const refreshSource = useCallback(async () => {
    const fresh = await refreshContent?.();
    const next = pickVideoSource(fresh, true);
    return next.state === "ready" ? next.src : null;
  }, [refreshContent]);

  const { error: playbackError } = useHlsSource(videoRef, src, {
    autoPlay: true,
    refreshSource,
    hlsConfig: {
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      maxBufferSize: 10 * 1000 * 1000,
      startLevel: 0,
      abrMaxWithRealBitrate: true,
      abrBandWidthFactor: 0.7,
    },
  });

  const emptyMessage =
    source.state === "processing" ? VIDEO_PROCESSING_MESSAGE : "Video chưa được upload hoặc đang xử lý";

  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>Xem trước video bài giảng</DialogDescription>
        </DialogHeader>

        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {isChecking ? (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm text-gray-400">Đang tải video...</p>
              </div>
            </div>
          ) : src ? (
            <>
              <video
                ref={videoRef}
                controls
                className="w-full h-full"
              >
                Trình duyệt không hỗ trợ video.
              </video>
              {playbackError && (
                <div
                  role="alert"
                  className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-center p-4"
                >
                  <p className="text-red-400 mb-2">{playbackError}</p>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4 text-center text-white">
              <p>{emptyMessage}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function CourseSyllabus({
  sections,
  isEnrolled = false,
  courseSlug,
  showTrialLinks = false,
  className,
}: CourseSyllabusProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(
    sections.length > 0 ? [sections[0].id.toString()] : []
  );
  const [videoPreviewModal, setVideoPreviewModal] = useState(false);
  const [previewingVideo, setPreviewingVideo] = useState<PreviewingVideo | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const expandAll = () => {
    setExpandedSections(sections.map((s) => s.id.toString()));
  };

  const collapseAll = () => {
    setExpandedSections([]);
  };

  const handleViewVideo = (previewing: PreviewingVideo) => {
    setPreviewingVideo(previewing);
    setVideoPreviewModal(true);
  };

  const totalLessons = sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const totalDuration = sections.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Nội dung khóa học</h2>
          <p className="text-sm text-muted-foreground">
            {sections.length} phần • {totalLessons} bài học •{" "}
            {formatDuration(totalDuration)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Mở tất cả
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Thu gọn
          </Button>
        </div>
      </div>

      {/* Sections */}
      <div className="border rounded-lg overflow-hidden">
        {sections.map((section, idx) => {
          const isExpanded = expandedSections.includes(section.id.toString());
          const completedCount = section.lessons.filter(
            (l) => l.completed
          ).length;

          return (
            <div
              key={section.id}
              className={cn(idx !== 0 && "border-t")}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id.toString())}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ChevronRight
                    className={cn(
                      "h-5 w-5 transition-transform text-muted-foreground",
                      isExpanded && "rotate-90"
                    )}
                  />
                  <div className="text-left">
                    <p className="font-medium">
                      Phần {idx + 1}: {section.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {section.lessons.length} bài học •{" "}
                      {formatDuration(section.duration)}
                    </p>
                  </div>
                </div>
                {isEnrolled && (
                  <span className="text-sm text-muted-foreground">
                    {completedCount}/{section.lessons.length}
                  </span>
                )}
              </button>

              {/* Lessons */}
              {isExpanded && (
                <div className="bg-muted/30">
                  {section.lessons.map((lesson) => (
                    <ExpandableLessonRow
                      key={lesson.id}
                      lesson={lesson}
                      isEnrolled={isEnrolled}
                      courseSlug={courseSlug}
                      showTrialLinks={showTrialLinks}
                      onViewVideo={handleViewVideo}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        open={videoPreviewModal}
        onOpenChange={setVideoPreviewModal}
        previewing={previewingVideo}
      />
    </div>
  );
}
