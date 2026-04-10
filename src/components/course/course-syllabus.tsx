"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  onViewVideo: (content: LessonContent) => void;
}) {
  const { data: contentsRaw, isLoading } = useLessonContents(lessonId);
  const contents: LessonContent[] = Array.isArray(contentsRaw) ? contentsRaw : [];
  const canAccess = isEnrolled || isFreePreview;

  if (isLoading) {
    return (
      <div className="py-3 pl-16 pr-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải nội dung...
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
            onViewVideo(content);
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
                    onViewVideo(content);
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
  onViewVideo: (content: LessonContent) => void;
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

  const [videoError, setVideoError] = useState<string | null>(null);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Extract upload ID from HLS URL pattern: /api/hls/{uploadId}/master.m3u8
  const extractUploadId = (url: string): string | null => {
    const match = url.match(/\/hls\/([a-f0-9-]+)\//i);
    return match ? match[1] : null;
  };

  // Normalize URL
  const normalizeUrl = (url: string): string => {
    if (/^https?:\/\/localhost:5000\/api\//i.test(url)) {
      return url.replace(/^https?:\/\/localhost:5000\/api/i, "/api");
    }
    if (/^https?:\/\/api\.fortex\.ai\.vn\/api\//i.test(url)) {
      return url.replace(/^https?:\/\/api\.fortex\.ai\.vn\/api/i, "/api");
    }
    return url;
  };

  // Resolve video URL - check HLS availability and use fallback if needed
  useEffect(() => {
    if (!open || !content) {
      setResolvedVideoUrl("");
      return;
    }

    const url = content.video_hls_url ?? content.video_url;
    if (!url) {
      setResolvedVideoUrl("");
      return;
    }

    const normalizedUrl = normalizeUrl(url);
    const uploadId = extractUploadId(normalizedUrl);

    // If it's an HLS URL, check if HLS is ready
    if (uploadId && normalizedUrl.includes(".m3u8")) {
      setIsLoading(true);
      fetch(`/api/hls/${uploadId}/info`)
        .then((res) => res.json())
        .then((data) => {
          if (data.hls_ready === true) {
            // HLS ready - use HLS URL
            setResolvedVideoUrl(normalizedUrl);
          } else if (data.fallback_url) {
            // HLS not ready - use fallback (original video)
            setResolvedVideoUrl(data.fallback_url);
          } else {
            // No fallback available
            setVideoError("Video đang được xử lý, vui lòng thử lại sau.");
          }
        })
        .catch(() => {
          // API error - try original video_url as fallback
          if (content.video_url && content.video_url !== url) {
            setResolvedVideoUrl(normalizeUrl(content.video_url));
          } else {
            setVideoError("Không thể tải thông tin video.");
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      // Not an HLS URL - use directly
      setResolvedVideoUrl(normalizedUrl);
    }
  }, [open, content]);

  const isHls = resolvedVideoUrl.includes(".m3u8");

  useEffect(() => {
    if (!open || !resolvedVideoUrl || !videoRef.current || isLoading) return;

    setVideoError(null);
    const video = videoRef.current;

    if (isHls) {
      // Use hls.js for HLS streams
      import("hls.js").then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            maxBufferSize: 10 * 1000 * 1000,
            startLevel: 0,
            abrMaxWithRealBitrate: true,
            abrBandWidthFactor: 0.7,
          });
          hlsRef.current = hls;
          hls.loadSource(resolvedVideoUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              console.error("HLS Error:", data);
              setVideoError("Lỗi phát video HLS");
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = resolvedVideoUrl;
          video.play().catch(() => {});
        }
      });
    } else {
      // Regular video (mp4, etc.)
      video.src = resolvedVideoUrl;
      video.onerror = () => setVideoError("Không thể tải video");
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [open, resolvedVideoUrl, isHls, isLoading]);

  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>Xem trước video bài giảng</DialogDescription>
        </DialogHeader>

        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm text-gray-400">Đang tải video...</p>
              </div>
            </div>
          ) : resolvedVideoUrl ? (
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
          {resolvedVideoUrl && (
            <Button onClick={() => window.open(resolvedVideoUrl, "_blank")}>
              <Eye className="w-4 h-4 mr-2" />
              Mở trong tab mới
            </Button>
          )}
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
  const [previewingVideo, setPreviewingVideo] = useState<LessonContent | null>(null);

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

  const handleViewVideo = (content: LessonContent) => {
    setPreviewingVideo(content);
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
        content={previewingVideo}
      />
    </div>
  );
}
